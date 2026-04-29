local AuthCoreSDK = {}
AuthCoreSDK.__index = AuthCoreSDK

function AuthCoreSDK.new(baseUrl, appId, appSecret, appVersion)
    local self = setmetatable({}, AuthCoreSDK)
    self.baseUrl = baseUrl:gsub("/$", "")
    self.appId = appId
    self.appSecret = appSecret
    self.appVersion = appVersion
    self.licenseKey = nil
    return self
end

function AuthCoreSDK:getHwid()
    local handle = io.popen("hostname")
    local hostname = handle:read("*a"):gsub("%s+", "")
    handle:close()
    return hostname .. "-LUA-WIN"
end

function AuthCoreSDK:showMessage(message, title)
    title = title or "Admin Broadcast"
    local escaped = message:gsub("'", "''")
    local cmd = string.format("powershell -Command \"[Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('%s', '%s')\"", escaped, title)
    os.execute("start /B " .. cmd)
end

function AuthCoreSDK:post(endpoint, data)
    local payload = ""
    for k, v in pairs(data) do
        if type(v) == "string" then
            payload = payload .. string.format("\"%s\":\"%s\",", k, v)
        else
            payload = payload .. string.format("\"%s\":%s,", k, tostring(v))
        end
    end
    payload = "{" .. payload:sub(1, -2) .. "}"
    
    local url = self.baseUrl .. endpoint
    local cmd = string.format("powershell -Command \"(Invoke-RestMethod -Uri '%s' -Method Post -Body '%s' -ContentType 'application/json') | ConvertTo-Json -Compress\"", url, payload)
    
    local handle = io.popen(cmd)
    local result = handle:read("*a")
    handle:close()
    
    -- Basic JSON to Table (Simulated)
    return result
end

-- Simplified JSON extractor for Lua (since we don't want to force a JSON lib)
local function getJsonValue(json, key)
    local pattern = "\"" .. key .. "\":\"?(.-)\"?[,}]"
    return json:match(pattern)
end

function AuthCoreSDK:verify(licenseKey)
    self.licenseKey = licenseKey
    local payload = {
        appId = self.appId,
        appVersion = self.appVersion,
        appSecret = self.appSecret,
        licenceKey = licenseKey,
        hwid = self:getHwid(),
        integrityHash = "none"
    }

    local resJson = self:post("/runtime/validate", payload)
    if not resJson or resJson == "" then return { success = false, message = "Network Error" } end

    local status = getJsonValue(resJson, "status")
    local allowed = getJsonValue(resJson, "allowed")
    local success = (status == "true" or allowed == "true")
    
    local customMsg = getJsonValue(resJson, "customMessage")
    if success and customMsg and customMsg ~= "" then
        self:showMessage(customMsg)
    end

    return {
        success = success,
        message = getJsonValue(resJson, "message") or "Unknown",
        json = resJson
    }
end

function AuthCoreSDK:startHeartbeat(intervalMs)
    -- Lua is usually embedded, so we provide a function to call in your main loop
    -- or use a simple wait loop for CLI apps
    local lastHeartbeat = os.time()
    
    return function()
        if os.difftime(os.time(), lastHeartbeat) >= (intervalMs / 1000) then
            lastHeartbeat = os.time()
            local payload = {
                appId = self.appId,
                licenceKey = self.licenseKey
            }
            local resJson = self:post("/runtime/heartbeat", payload)
            
            if resJson then
                local customMsg = getJsonValue(resJson, "customMessage")
                if customMsg and customMsg ~= "" then
                    self:showMessage(customMsg)
                end

                if getJsonValue(resJson, "status") == "true" and getJsonValue(resJson, "currentStatus") == "killed" then
                    self:showMessage("Session terminated by administrator.", "Security Alert")
                    os.exit(1)
                end
            end
        end
    end
end

return AuthCoreSDK
