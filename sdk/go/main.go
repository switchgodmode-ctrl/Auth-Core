package main

import (
	"authcore"
	"bufio"
	"fmt"
	"os"
	"time"
)

func main() {
	fmt.Println("========================================")
	fmt.Println("        AUTHCORE GO SECURITY SDK        ")
	fmt.Println("========================================")

	baseURL := "https://auth-core-sz7p.vercel.app"
	appID := 2
	appSecret := "PxMzYyvs5zzA2f39MaXlMgJfGGY4qftQ"
	appVersion := "1.0"

	sdk := authcore.NewAuthCoreSDK(baseURL, appID, appSecret, appVersion)

	fmt.Print("\n[>] Enter Licence Key: ")
	scanner := bufio.NewScanner(os.Stdin)
	scanner.Scan()
	key := scanner.Text()

	if key == "" {
		fmt.Println("[!] Key required.")
		return
	}

	fmt.Println("[*] Authenticating...")
	res, err := sdk.Verify(key)
	if err != nil {
		fmt.Printf("\n[-] Network Error: %v\n", err)
		return
	}

	if res.Success {
		fmt.Printf("\n[+] Access Granted! Welcome, %v\n", res.Message)
		sdk.StartHeartbeat(15000)
		
		fmt.Println("\n[*] Application is running.")
		fmt.Println("[*] Admin broadcasts will appear in a MessageBox.")
		fmt.Println("[*] Press Ctrl+C to exit.")

		// Keep alive
		select {}
	} else {
		fmt.Printf("\n[-] Access Denied: %v\n", res.Message)
		time.Sleep(3 * time.Second)
	}
}
