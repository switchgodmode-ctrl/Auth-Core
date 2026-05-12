const axios = require('axios');
const { getHwid, getHardwareSignals } = require('./hwid');

class AuthCoreSDK {
    constructor(baseUrl, appId, appSecret, appVersion) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.appId = appId;
        this.appSecret = appSecret;
        this.appVersion = appVersion;
        this.licenseKey = null;
    }

    async verify(licenseKey) {
        this.licenseKey = licenseKey;
        const payload = {
            appId: this.appId,
            appVersion: this.appVersion,
            appSecret: this.appSecret,
            licenceKey: licenseKey,
            hwid: getHwid(),
            signals: getHardwareSignals(),
            integrityHash: 'none'
        };

        try {
            const response = await axios.post(`${this.baseUrl}/runtime/validate`, payload);
            const res = response.data;
            const success = res.status === 'true' || res.allowed === true;

            return {
                success,
                message: res.message || 'Unknown Error',
                data: res
            };
        } catch (error) {
            return {
                success: false,
                message: error.response ? error.response.data.message : error.message
            };
        }
    }

    startHeartbeat(intervalMs = 15000) {
        if (!this.license_key && !this.licenseKey) return;
        
        setInterval(async () => {
            try {
                const payload = {
                    appId: this.appId,
                    licenceKey: this.licenseKey,
                    hwid: getHwid()
                };
                const response = await axios.post(`${this.baseUrl}/runtime/heartbeat`, payload);
                const data = response.data;

                if (data.status === 'true' && data.currentStatus === 'killed') {
                    console.error('[SECURITY] Session terminated by administrator.');
                    process.exit(1);
                }
            } catch (error) {
                // Ignore network errors
            }
        }, intervalMs);
    }
}

module.exports = AuthCoreSDK;
