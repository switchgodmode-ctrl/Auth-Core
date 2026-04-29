const https = require('https');
const os = require('os');
const { exec } = require('child_process');

class AuthCoreSDK {
    constructor(baseUrl, appId, appSecret, appVersion) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.appId = appId;
        this.appSecret = appSecret;
        this.appVersion = appVersion;
        this.licenseKey = null;
    }

    getHwid() {
        // Basic HWID for Node
        return `${os.hostname()}-${os.platform()}-${os.arch()}`;
    }

    showMessage(message, title = "Admin Broadcast") {
        if (process.platform === 'win32') {
            const escaped = message.replace(/'/g, "''");
            const cmd = `powershell -Command "[Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('${escaped}', '${title}')"`;
            exec(cmd);
        } else {
            console.log(`\n[${title}] ${message}`);
        }
    }

    async post(endpoint, data) {
        return new Promise((resolve, reject) => {
            const payload = JSON.stringify(data);
            const url = new URL(this.baseUrl + endpoint);
            
            const options = {
                hostname: url.hostname,
                path: url.pathname + url.search,
                port: url.port || 443,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                });
            });

            req.on('error', (e) => reject(e));
            req.write(payload);
            req.end();
        });
    }

    async verify(licenseKey) {
        this.licenseKey = licenseKey;
        const payload = {
            appId: this.appId,
            appVersion: this.appVersion,
            appSecret: this.appSecret,
            licenceKey: licenseKey,
            hwid: this.getHwid(),
            integrityHash: "none"
        };

        try {
            const res = await this.post('/runtime/validate', payload);
            const success = res.status === "true" || res.allowed === true;
            
            if (success && res.customMessage) {
                this.showMessage(res.customMessage);
            }

            return {
                success,
                message: res.message || "Unknown Error",
                data: res
            };
        } catch (e) {
            return { success: false, message: `Network Error: ${e.message}` };
        }
    }

    startHeartbeat(intervalMs = 15000) {
        if (!this.licenseKey) return;

        setInterval(async () => {
            try {
                const res = await this.post('/runtime/heartbeat', {
                    appId: this.appId,
                    licenceKey: this.licenseKey
                });

                if (res.customMessage) {
                    this.showMessage(res.customMessage);
                }

                if (res.status === "true" && res.currentStatus === "killed") {
                    this.showMessage("Session terminated by administrator.", "Security Alert");
                    setTimeout(() => process.exit(1), 1000);
                }
            } catch (e) {
                // Network error, ignore and retry next interval
            }
        }, intervalMs);
    }
}

module.exports = AuthCoreSDK;
