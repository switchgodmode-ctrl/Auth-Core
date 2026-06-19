use std::thread;
use std::time::Duration;
use std::process::{self, Command};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize)]
struct VerifyPayload {
    #[serde(rename = "appId")]
    app_id: i32,
    #[serde(rename = "appVersion")]
    app_version: String,
    #[serde(rename = "appSecret")]
    app_secret: String,
    #[serde(rename = "licenceKey")]
    licence_key: String,
    hwid: String,
    signals: HashMap<String, String>,
    #[serde(rename = "integrityHash")]
    integrity_hash: String,
}

pub struct AuthCoreSDK {
    base_url: String,
    app_id: i32,
    app_secret: String,
    app_version: String,
    license_key: Option<String>,
    session_token: Option<String>, // Issued by server on valid login — required for heartbeat
}

impl AuthCoreSDK {
    pub fn new(base_url: &str, app_id: i32, app_secret: &str, app_version: &str) -> Self {
        Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            app_id,
            app_secret: app_secret.to_string(),
            app_version: app_version.to_string(),
            license_key: None,
            session_token: None,
        }
    }

    fn get_wmi(property: &str, class: &str) -> String {
        let output = Command::new("wmic")
            .args(&[class, "get", property])
            .output();
        
        if let Ok(out) = output {
            let s = String::from_utf8_lossy(&out.stdout);
            let lines: Vec<&str> = s.trim().lines().collect();
            if lines.len() > 1 {
                return lines[1].trim().to_string();
            }
        }
        "unknown".to_string()
    }

    pub fn get_hardware_signals() -> HashMap<String, String> {
        let mut signals = HashMap::new();
        #[cfg(target_os = "windows")]
        {
            signals.insert("cpuId".to_string(), Self::get_wmi("processorid", "cpu"));
            signals.insert("motherboard".to_string(), Self::get_wmi("serialnumber", "baseboard"));
            signals.insert("uuid".to_string(), Self::get_wmi("uuid", "csproduct"));
            signals.insert("disk".to_string(), Self::get_wmi("serialnumber", "diskdrive"));
        }
        signals
    }

    pub fn get_hwid() -> String {
        let signals = Self::get_hardware_signals();
        let base_str = format!("{}|{}|{}", 
            signals.get("uuid").unwrap_or(&"unknown".to_string()),
            signals.get("motherboard").unwrap_or(&"unknown".to_string()),
            signals.get("cpuId").unwrap_or(&"unknown".to_string())
        );
        let digest = md5::compute(base_str); // Simple hash for example, use sha2 if available in dependencies
        format!("{:x}", digest)
    }

    pub fn show_message(&self, message: &str, title: &str) {
        let msg = message.to_string();
        let ttl = title.to_string();
        thread::spawn(move || {
            #[cfg(target_os = "windows")]
            {
                use std::ffi::OsStr;
                use std::os::windows::ffi::OsStrExt;
                let msg_wide: Vec<u16> = OsStr::new(&msg).encode_wide().chain(Some(0)).collect();
                let title_wide: Vec<u16> = OsStr::new(&ttl).encode_wide().chain(Some(0)).collect();
                unsafe {
                    // This assumes winapi crate is in Cargo.toml
                    // For the SDK template we use what's available
                }
            }
            println!("\n[{}] {}", ttl, msg);
        });
    }

    pub fn verify(&mut self, license_key: &str) -> Result<bool, Box<dyn std::error::Error>> {
        self.license_key = Some(license_key.to_string());
        let payload = VerifyPayload {
            app_id: self.app_id,
            app_version: self.app_version.clone(),
            app_secret: self.app_secret.clone(),
            licence_key: license_key.to_string(),
            hwid: Self::get_hwid(),
            signals: Self::get_hardware_signals(),
            integrity_hash: "none".to_string(),
        };

        let resp: serde_json::Value = ureq::post(&format!("{}/runtime/validate", self.base_url))
            .send_json(payload)?
            .into_json()?;

        let success = resp["status"] == "true" || resp["allowed"] == true;

        // Capture session token — only a real server response includes this
        if success {
            if let Some(token) = resp["sessionToken"].as_str() {
                if !token.is_empty() {
                    self.session_token = Some(token.to_string());
                }
            }
        }
        
        if success {
            if let Some(msg) = resp["customMessage"].as_str() {
                if !msg.is_empty() {
                    self.show_message(msg, "Admin Broadcast");
                }
            }
        }

        Ok(success)
    }

    pub fn start_heartbeat(&self, interval_ms: u64) {
        let base_url = self.base_url.clone();
        let app_id = self.app_id;
        let license_key = self.license_key.clone().unwrap_or_default();
        let session_token = std::sync::Arc::new(std::sync::Mutex::new(
            self.session_token.clone().unwrap_or_default()
        ));

        thread::spawn(move || {
            loop {
                thread::sleep(Duration::from_millis(interval_ms));
                let current_token = session_token.lock().unwrap().clone();
                let payload = serde_json::json!({
                    "appId": app_id,
                    "licenceKey": license_key,
                    "hwid": Self::get_hwid(),
                    "sessionToken": current_token  // empty for crackers who bypassed login
                });

                if let Ok(resp) = ureq::post(&format!("{}/runtime/heartbeat", base_url))
                    .send_json(payload)
                {
                    if let Ok(res) = resp.into_json::<serde_json::Value>() {
                        // Rotate token each beat
                        if let Some(new_token) = res["sessionToken"].as_str() {
                            if !new_token.is_empty() {
                                *session_token.lock().unwrap() = new_token.to_string();
                            }
                        }
                        if res["active"] == false || res["currentStatus"] == "killed" {
                            process::exit(1);
                        }
                    }
                }
            }
        });
    }
}
