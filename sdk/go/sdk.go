package authcore

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"runtime"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

type AuthCoreSDK struct {
	BaseURL    string
	AppID      int
	AppSecret  string
	AppVersion string
	LicenseKey string
}

func NewAuthCoreSDK(baseUrl string, appId int, appSecret string, appVersion string) *AuthCoreSDK {
	return &AuthCoreSDK{
		BaseURL:    strings.TrimSuffix(baseUrl, "/"),
		AppID:      appId,
		AppSecret:  appSecret,
		AppVersion: appVersion,
	}
}

func (sdk *AuthCoreSDK) GetHWID() string {
	hostname, _ := os.Hostname()
	return fmt.Sprintf("%s-%s-%s", hostname, runtime.GOOS, runtime.GOARCH)
}

func (sdk *AuthCoreSDK) ShowMessage(message, title string) {
	if runtime.GOOS == "windows" {
		user32 := syscall.NewLazyDLL("user32.dll")
		messageBox := user32.NewProc("MessageBoxW")
		
		lpText, _ := syscall.UTF16PtrFromString(message)
		lpCaption, _ := syscall.UTF16PtrFromString(title)
		
		go messageBox.Call(0, uintptr(unsafePointer(lpText)), uintptr(unsafePointer(lpCaption)), 0x40)
	} else {
		fmt.Printf("\n[%s] %s\n", title, message)
	}
}

// Internal helper for Windows API
func unsafePointer(p *uint16) unsafe.Pointer {
	return unsafe.Pointer(p)
}

type verifyPayload struct {
	AppID         int    `json:"appId"`
	AppVersion    string `json:"appVersion"`
	AppSecret     string `json:"appSecret"`
	LicenceKey    string `json:"licenceKey"`
	HWID          string `json:"hwid"`
	IntegrityHash string `json:"integrityHash"`
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
				"appId":      sdk.AppID,
				"licenceKey": sdk.LicenseKey,
			}
			body, _ := json.Marshal(payload)
			resp, err := http.Post(sdk.BaseURL+"/runtime/heartbeat", "application/json", bytes.NewBuffer(body))
			if err != nil {
				continue
			}

			var res map[string]interface{}
			json.NewDecoder(resp.Body).Decode(&res)
			resp.Body.Close()

			if msg, ok := res["customMessage"].(string); ok && msg != "" {
				sdk.ShowMessage(msg, "Admin Broadcast")
			}

			if res["status"] == "true" && res["currentStatus"] == "killed" {
				sdk.ShowMessage("Session terminated by administrator.", "Security Alert")
				time.Sleep(2 * time.Second)
				os.Exit(1)
			}
		}
	}()
}
