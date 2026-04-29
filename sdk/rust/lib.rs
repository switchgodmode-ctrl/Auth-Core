use std::thread;
use std::time::Duration;
use std::process;
use serde::{Deserialize, Serialize};

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
    #[serde(rename = "integrityHash")]
    integrity_hash: String,
}

pub struct AuthCoreSDK {
    base_url: String,
    app_id: i32,
    app_secret: String,
    app_version: String,
    license_key: Option<String>,
}

impl AuthCoreSDK {
    pub fn new(base_url: &str, app_id: i32, app_secret: &str, app_version: &str) -> Self {
        Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            app_id,
            app_secret: app_secret.to_string(),
            app_version: app_version.to_string(),
            license_key: None,
        }
    }

    pub fn get_hwid() -> String {
        format!("{}-{}-{}", std::env::consts::OS, std::env::consts::ARCH, "RUST")
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
                    winapi::um::winuser::MessageBoxW(
                        std::ptr::null_mut(),
                        msg_wide.as_ptr(),
                        title_wide.as_ptr(),
                        winapi::um::winuser::MB_OK | winapi::um::winuser::MB_ICONINFORMATION,
                    );
                }
            }
            #[cfg(not(target_os = "windows"))]
            {
                println!("\n[{}] {}", ttl, msg);
            }
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
            integrity_hash: "none".to_string(),
        };

        let resp: serde_json::Value = ureq::post(&format!("{}/runtime/validate", self.base_url))
            .send_json(payload)?
            .into_json()?;

        let success = resp["status"] == "true" || resp["allowed"] == true;
        
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
        let sdk_ref = self.clone(); // Needs Clone implementation

        thread::spawn(move || {
            loop {
                thread::sleep(Duration::from_millis(interval_ms));
                let payload = serde_json::json!({
                    "appId": app_id,
                    "licenceKey": license_key
                });

                if let Ok(resp) = ureq::post(&format!("{}/runtime/heartbeat", base_url))
                    .send_json(payload)
                {
                    if let Ok(res) = resp.into_json::<serde_json::Value>() {
                        if let Some(msg) = res["customMessage"].as_str() {
                            if !msg.is_empty() {
                                // Direct call since we don't have self here
                                // Better to pass a sender or use an Arc
                            }
                        }

                        if res["status"] == "true" && res["currentStatus"] == "killed" {
                            process::exit(1);
                        }
                    }
                }
            }
        });
    }
}
