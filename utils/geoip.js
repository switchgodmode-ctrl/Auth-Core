import https from 'https';

export const resolveGeoIP = (ip) => {
    return new Promise((resolve) => {
        if (!ip) {
            return resolve({ country: "Unknown", countryCode: "UN", region: "Unknown", city: "Unknown", isp: "Unknown" });
        }
        
        // Clean IPv6 wrapping
        const cleanIp = ip.replace(/^::ffff:/, '').trim();
        
        // Check if loopback or local
        if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost' || cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.') || cleanIp === "") {
            // Curate a set of professional mock locations for local testing
            const mocks = [
                { country: "United States", countryCode: "US", region: "California", city: "San Francisco", isp: "Cloudflare Inc." },
                { country: "India", countryCode: "IN", region: "Maharashtra", city: "Mumbai", isp: "Reliance Jio Infocomm" },
                { country: "Germany", countryCode: "DE", region: "Hesse", city: "Frankfurt", isp: "Deutsche Telekom" },
                { country: "Japan", countryCode: "JP", region: "Tokyo", city: "Chiyoda", isp: "NTT Communications" },
                { country: "United Kingdom", countryCode: "GB", region: "England", city: "London", isp: "British Telecom" }
            ];
            // Assign mock locations based on a deterministic hash of the local IP or randomly
            const hash = cleanIp.split('.').reduce((acc, val) => acc + (parseInt(val) || 0), 0) || Math.floor(Math.random() * 100);
            return resolve(mocks[hash % mocks.length]);
        }

        https.get(`https://ipapi.co/${cleanIp}/json/`, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) {
                        return resolve({ country: "Unknown Country", countryCode: "UN", region: "Unknown Region", city: "Unknown City", isp: "Unknown Provider" });
                    }
                    resolve({
                        country: parsed.country_name || "Unknown Country",
                        countryCode: parsed.country_code || "UN",
                        region: parsed.region || "Unknown Region",
                        city: parsed.city || "Unknown City",
                        isp: parsed.org || "Unknown Provider"
                    });
                } catch {
                    resolve({ country: "Unknown Country", countryCode: "UN", region: "Unknown Region", city: "Unknown City", isp: "Unknown Provider" });
                }
            });
        }).on('error', () => {
            resolve({ country: "Unknown Country", countryCode: "UN", region: "Unknown Region", city: "Unknown City", isp: "Unknown Provider" });
        });
    });
};
