<?php

class AuthCoreSDK {
    private $baseUrl;
    private $appId;
    private $appSecret;
    private $appVersion;
    private $licenseKey;

    public function __construct($baseUrl, $appId, $appSecret, $appVersion) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->appId = $appId;
        $this->appSecret = $appSecret;
        $this->appVersion = $appVersion;
    }

    public function getHwid() {
        return gethostname() . "-" . php_uname('n') . "-" . php_uname('r');
    }

    private function showMessage($message, $title = "Admin Broadcast") {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $escaped = str_replace("'", "''", $message);
            $cmd = "powershell -Command \"[Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('$escaped', '$title')\"";
            pclose(popen("start /B $cmd", "r"));
        } else {
            echo "\n[$title] $message\n";
        }
    }

    private function post($endpoint, $data) {
        $url = $this->baseUrl . $endpoint;
        $payload = json_encode($data);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $result = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($result, true);
    }

    public function verify($licenseKey) {
        $this->licenseKey = licenseKey;
        $payload = [
            "appId" => $this->appId,
            "appVersion" => $this->appVersion,
            "appSecret" => $this->appSecret,
            "licenceKey" => $licenseKey,
            "hwid" => $this->getHwid(),
            "integrityHash" => "none"
        ];

        try {
            $res = $this->post('/runtime/validate', $payload);
            $success = ($res['status'] === "true" || $res['allowed'] === true);
            
            if ($success && !empty($res['customMessage'])) {
                $this->showMessage($res['customMessage']);
            }

            return [
                "success" => $success,
                "message" => $res['message'] ?? "Unknown Error",
                "data" => $res
            ];
        } catch (Exception $e) {
            return ["success" => false, "message" => "Network Error: " . $e->getMessage()];
        }
    }

    public function startHeartbeat($intervalMs = 15000) {
        // Note: PHP is synchronous. Real-time heartbeat usually requires a CLI loop or separate process.
        // This is a basic implementation for a CLI application.
        while (true) {
            usleep($intervalMs * 1000);
            try {
                $res = $this->post('/runtime/heartbeat', [
                    "appId" => $this->appId,
                    "licenceKey" => $this->licenseKey
                ]);

                if (!empty($res['customMessage'])) {
                    $this->showMessage($res['customMessage']);
                }

                if ($res['status'] === "true" && $res['currentStatus'] === "killed") {
                    $this->showMessage("Session terminated by administrator.", "Security Alert");
                    exit(1);
                }
            } catch (Exception $e) {}
        }
    }
}
