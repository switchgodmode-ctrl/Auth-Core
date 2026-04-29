local AuthCoreSDK = require("sdk")
local os = require("os")
local io = require("io")

-- Console styling
if package.config:sub(1,1) == "\\" then
    os.execute("title AuthCore Lua Security Console")
    os.execute("color 0B")
end

print("========================================")
print("       AUTHCORE LUA SECURITY SDK        ")
print("========================================")

local baseUrl    = "https://auth-core-sz7p.vercel.app"
local appId      = 2
local appSecret  = "PxMzYyvs5zzA2f39MaXlMgJfGGY4qftQ"
local appVersion = "1.0"

local sdk = AuthCoreSDK.new(baseUrl, appId, appSecret, appVersion)

io.write("\n[>] Enter Licence Key: ")
io.flush()
local key = io.read("*l")

if not key or key == "" then
    print("[!] Key required.")
    os.exit(1)
end

print("[*] Authenticating...")
local res = sdk:verify(key)

if res.success then
    print("\n[+] Access Granted! Welcome, " .. (res.message or ""))
    local heartbeat = sdk:startHeartbeat(15000)

    print("\n[*] Application is running.")
    print("[*] Admin broadcasts will appear in a MessageBox.")
    print("[*] Press Ctrl+C to exit.")

    while true do
        heartbeat()      -- call each loop iteration to handle timing
        os.execute("ping -n 2 127.0.0.1 >nul")   -- ~1 second sleep
    end
else
    print("\n[-] Access Denied: " .. (res.message or "Unknown Error"))
    os.execute("ping -n 4 127.0.0.1 >nul")
end
