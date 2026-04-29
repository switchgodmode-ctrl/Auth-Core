mod lib;
use lib::AuthCoreSDK;
use std::io::{self, Write};

fn main() {
    println!("========================================");
    println!("       AUTHCORE RUST SECURITY SDK       ");
    println!("========================================");

    let base_url = "https://auth-core-sz7p.vercel.app";
    let app_id = 2;
    let app_secret = "PxMzYyvs5zzA2f39MaXlMgJfGGY4qftQ";
    let app_version = "1.0";

    let mut sdk = AuthCoreSDK::new(base_url, app_id, app_secret, app_version);

    print!("\n[>] Enter Licence Key: ");
    io::stdout().flush().unwrap();
    
    let mut key = String::new();
    io::stdin().read_line(&mut key).unwrap();
    let key = key.trim();

    if key.is_empty() {
        println!("[!] Key required.");
        return;
    }

    println!("[*] Authenticating...");
    match sdk.verify(key) {
        Ok(true) => {
            println!("\n[+] Access Granted!");
            sdk.start_heartbeat(15000);
            
            println!("\n[*] Application is running.");
            println!("[*] Admin broadcasts will appear in a MessageBox.");
            println!("[*] Press Ctrl+C to exit.");

            loop {
                std::thread::sleep(std::time::Duration::from_secs(1));
            }
        }
        Ok(false) => {
            println!("\n[-] Access Denied.");
            std::thread::sleep(std::time::Duration::from_secs(3));
        }
        Err(e) => {
            println!("\n[-] Error: {}", e);
        }
    }
}
