package authcore

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

type AuthCoreSDK struct {
	BaseURL      string
	AppID        int
	AppSecret    string
	AppVersion   string
	LicenseKey   string
	SessionToken string // Issued by server on valid login — required for heartbeat
}

func NewAuthCoreSDK(baseUrl string, appId int, appSecret string, appVersion string) *AuthCoreSDK {
	return &AuthCoreSDK{
		BaseURL:    strings.TrimSuffix(baseUrl, "/"),
		AppID:      appId,
		AppSecret:  appSecret,
		AppVersion: appVersion,
	}
}

func getWmiProperty(property string, class string) string {
	cmd := exec.Command("wmic", class, "get", property)
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		return "unknown"
	}
	lines := strings.Split(strings.TrimSpace(out.String()), "\n")
	if len(lines) > 1 {
		return strings.TrimSpace(lines[1])
	}
	return "unknown"
}

func (sdk *AuthCoreSDK) GetHardwareSignals() map[string]string {
	if runtime.GOOS == "windows" {
		return map[string]string{
			"cpuId":       getWmiProperty("processorid", "cpu"),
			"motherboard": getWmiProperty("serialnumber", "baseboard"),
			"uuid":        getWmiProperty("uuid", "csproduct"),
			"disk":        getWmiProperty("serialnumber", "diskdrive"),
		}
	}
	hostname, _ := os.Hostname()
	return map[string]string{"hostname": hostname}
}

func (sdk *AuthCoreSDK) GetHWID() string {
	signals := sdk.GetHardwareSignals()
	baseStr := fmt.Sprintf("%s|%s|%s", signals["uuid"], signals["motherboard"], signals["cpuId"])
	hash := sha256.Sum256([]byte(baseStr))
	return hex.EncodeToString(hash[:])
}

func (sdk *AuthCoreSDK) ShowMessage(message, title string) {
	if runtime.GOOS == "windows" {
		user32 := syscall.NewLazyDLL("user32.dll")
		messageBox := user32.NewProc("MessageBoxW")
		
		lpText, _ := syscall.UTF16PtrFromString(message)
		lpCaption, _ := syscall.UTF16PtrFromString(title)
		
		go messageBox.Call(0, uintptr(unsafe.Pointer(lpText)), uintptr(unsafe.Pointer(lpCaption)), 0x40)
	} else {
		fmt.Printf("\n[%s] %s\n", title, message)
	}
}

type verifyPayload struct {
	AppID         int               `json:"appId"`
	AppVersion    string            `json:"appVersion"`
	AppSecret     string            `json:"appSecret"`
	LicenceKey    string            `json:"licenceKey"`
	HWID          string            `json:"hwid"`
	Signals       map[string]string `json:"signals"`
	IntegrityHash string            `json:"integrityHash"`
}

type AuthResponse struct {
	Success bool
	Message string
	Data    map[string]interface{}
}

func (sdk *AuthCoreSDK) Verify(licenseKey string) (*AuthResponse, error) {
	sdk.LicenseKey = licenseKey
	payload := verifyPayload{
		AppID:         sdk.AppID,
		AppVersion:    sdk.AppVersion,
		AppSecret:     sdk.AppSecret,
		LicenceKey:    licenseKey,
		HWID:          sdk.GetHWID(),
		Signals:       sdk.GetHardwareSignals(),
		IntegrityHash: "none",
	}

	body, _ := json.Marshal(payload)
	resp, err := http.Post(sdk.BaseURL+"/runtime/validate", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var res map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&res)

	success := res["status"] == "true" || res["allowed"] == true

	// Capture session token — only a real server response includes this
	if success {
		if token, ok := res["sessionToken"].(string); ok && token != "" {
			sdk.SessionToken = token
		}
	}
	
	if success {
		if msg, ok := res["customMessage"].(string); ok && msg != "" {
			sdk.ShowMessage(msg, "Admin Broadcast")
		}
	}

	return &AuthResponse{
		Success: success,
		Message: fmt.Sprintf("%v", res["message"]),
		Data:    res,
	}, nil
}

func (sdk *AuthCoreSDK) StartHeartbeat(intervalMs int) {
	ticker := time.NewTicker(time.Duration(intervalMs) * time.Millisecond)
	go func() {
		for range ticker.C {
			payload := map[string]interface{}{
				"appId":        sdk.AppID,
				"licenceKey":   sdk.LicenseKey,
				"hwid":         sdk.GetHWID(),
				"sessionToken": sdk.SessionToken, // empty string for crackers who bypassed login
			}
			body, _ := json.Marshal(payload)
			resp, err := http.Post(sdk.BaseURL+"/runtime/heartbeat", "application/json", bytes.NewBuffer(body))
			if err != nil {
				continue
			}

			var res map[string]interface{}
			json.NewDecoder(resp.Body).Decode(&res)
			resp.Body.Close()

			// Rotate token each beat
			if newToken, ok := res["sessionToken"].(string); ok && newToken != "" {
				sdk.SessionToken = newToken
			}

			if msg, ok := res["customMessage"].(string); ok && msg != "" {
				sdk.ShowMessage(msg, "Admin Broadcast")
			}

			if res["active"] == false || res["currentStatus"] == "killed" {
				sdk.ShowMessage("Session terminated by administrator.", "Security Alert")
				time.Sleep(2 * time.Second)
				os.Exit(1)
			}
		}
	}()
}
