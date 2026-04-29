package com.authcore;

import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        // Simple console UI
        System.out.println("========================================");
        System.out.println("       AUTHCORE JAVA SECURITY SDK       ");
        System.out.println("========================================");

        String baseUrl = "https://auth-core-sz7p.vercel.app";
        int appId = 2;
        String appSecret = "PxMzYyvs5zzA2f39MaXlMgJfGGY4qftQ";
        String appVersion = "1.0";

        Sdk sdk = new Sdk(baseUrl, appId, appSecret, appVersion);

        Scanner scanner = new Scanner(System.in);
        System.out.print("\n[>] Enter Licence Key: ");
        String key = scanner.nextLine();

        if (key.isEmpty()) {
            System.out.println("[!] Error: Key required.");
            return;
        }

        System.out.println("[*] Authenticating...");
        Sdk.AuthResponse res = sdk.verify(key);

        if (res.success) {
            System.out.println("\n[+] Access Granted! Welcome, " + res.message);
            sdk.startHeartbeat(15000);
            
            System.out.println("\n[*] Application is running.");
            System.out.println("[*] Admin broadcasts will appear in a MessageBox.");
            System.out.println("[*] Press Ctrl+C to exit.");

            while (true) {
                try { Thread.sleep(1000); } catch (InterruptedException ignored) {}
            }
        } else {
            System.out.println("\n[-] Access Denied: " + res.message);
            try { Thread.sleep(3000); } catch (InterruptedException ignored) {}
        }
    }
}
