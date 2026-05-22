import https from 'https';

export const resolveGeoIP = (ip) => {
    return new Promise((resolve) => {
        if (!ip) {
            return resolve({ country: "Unknown", countryCode: "UN", region: "Unknown", city: "Unknown", isp: "Unknown", latitude: 0, longitude: 0 });
        }
        
        // Clean IPv6 wrapping
        const cleanIp = ip.replace(/^::ffff:/, '').trim();
        
        // Check if loopback or local
        if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost' || cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.') || cleanIp === "") {
            // Curate a set of professional mock locations for local testing
            const mocks = [
                { country: "United States", countryCode: "US", region: "California", city: "San Francisco", isp: "Cloudflare Inc.", latitude: 37.7749, longitude: -122.4194 },
                { country: "India", countryCode: "IN", region: "Maharashtra", city: "Mumbai", isp: "Reliance Jio Infocomm", latitude: 19.0760, longitude: 72.8777 },
                { country: "Germany", countryCode: "DE", region: "Hesse", city: "Frankfurt", isp: "Deutsche Telekom", latitude: 50.1109, longitude: 8.6821 },
                { country: "Japan", countryCode: "JP", region: "Tokyo", city: "Chiyoda", isp: "NTT Communications", latitude: 35.6762, longitude: 139.6503 },
                { country: "United Kingdom", countryCode: "GB", region: "England", city: "London", isp: "British Telecom", latitude: 51.5074, longitude: -0.1278 }
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
                        return resolve({ country: "Unknown Country", countryCode: "UN", region: "Unknown Region", city: "Unknown City", isp: "Unknown Provider", latitude: 0, longitude: 0 });
                    }
                    resolve({
                        country: parsed.country_name || "Unknown Country",
                        countryCode: parsed.country_code || "UN",
                        region: parsed.region || "Unknown Region",
                        city: parsed.city || "Unknown City",
                        isp: parsed.org || "Unknown Provider",
                        latitude: Number(parsed.latitude) || 0,
                        longitude: Number(parsed.longitude) || 0
                    });
                } catch {
                    resolve({ country: "Unknown Country", countryCode: "UN", region: "Unknown Region", city: "Unknown City", isp: "Unknown Provider", latitude: 0, longitude: 0 });
                }
            });
        }).on('error', () => {
            resolve({ country: "Unknown Country", countryCode: "UN", region: "Unknown Region", city: "Unknown City", isp: "Unknown Provider" });
        });
    });
};
