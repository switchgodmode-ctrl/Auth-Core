<?php
require_once 'sdk.php';

// Console styling
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    system('title AuthCore PHP Security Console');
    system('color 0B');
}

echo "========================================\n";
echo "       AUTHCORE PHP SECURITY SDK        \n";
echo "========================================\n";

$baseUrl = "https://auth-core-sz7p.vercel.app";
$appId = 2;
$appSecret = "PxMzYyvs5zzA2f39MaXlMgJfGGY4qftQ";
$appVersion = "1.0";

$sdk = new AuthCoreSDK($baseUrl, $appId, $appSecret, $appVersion);

echo "\n[>] Enter Licence Key: ";
$key = trim(fgets(STDIN));

if (empty($key)) {
    echo "[!] Key required.\n";
    exit(1);
}

echo "[*] Authenticating...\n";
$res = $sdk->verify($key);

if ($res['success']) {
    echo "\n[+] Access Granted! Welcome, " . $res['message'] . "\n";
    echo "\n[*] Application is running.\n";
    echo "[*] Admin broadcasts will appear in a MessageBox.\n";
    echo "[*] Press Ctrl+C to exit.\n";
    
    // Heartbeat loop (PHP CLI stays active)
    $sdk->startHeartbeat(15000);
} else {
    echo "\n[-] Access Denied: " . $res['message'] . "\n";
    sleep(3);
}
