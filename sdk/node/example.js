const AuthCoreSDK = require('./sdk');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    process.stdout.write('\x1b]2;AuthCore Node.js Security Console\x07');
    console.log("========================================");
    console.log("     AUTHCORE NODE.JS SECURITY SDK      ");
    console.log("========================================");

    const baseUrl = "https://auth-core-sz7p.vercel.app";
    const appId = 2;
    const appSecret = "PxMzYyvs5zzA2f39MaXlMgJfGGY4qftQ";
    const appVersion = "1.0";

    const sdk = new AuthCoreSDK(baseUrl, appId, appSecret, appVersion);

    rl.question('\n[>] Enter Licence Key: ', async (key) => {
        if (!key) {
            console.log("[!] Key required.");
            process.exit(1);
        }

        console.log("[*] Authenticating...");
        const res = await sdk.verify(key);

        if (res.success) {
            console.log(`\n[+] Access Granted! Welcome, ${res.message}`);
            sdk.startHeartbeat(15000);
            
            console.log("\n[*] Application is running.");
            console.log("[*] Admin broadcasts will appear in a MessageBox.");
            console.log("[*] Press Ctrl+C to exit.");

            // Keep alive
            setInterval(() => {}, 1000);
        } else {
            console.log(`\n[-] Access Denied: ${res.message}`);
            setTimeout(() => process.exit(0), 3000);
        }
    });
}

main();
