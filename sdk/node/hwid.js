const { execSync } = require('child_process');
const crypto = require('crypto');

function getWmiProperty(command) {
    try {
        const output = execSync(command).toString().trim();
        const lines = output.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 1) {
            return lines[1];
        }
        return "unknown";
    } catch (e) {
        return "unknown";
    }
}

function getHardwareSignals() {
    if (process.platform !== 'win32') {
        return { platform: process.platform, arch: process.arch };
    }
    return {
        cpuId: getWmiProperty('wmic cpu get processorid'),
        motherboard: getWmiProperty('wmic baseboard get serialnumber'),
        uuid: getWmiProperty('wmic csproduct get uuid'),
        disk: getWmiProperty('wmic diskdrive get serialnumber')
    };
}

function getHwid() {
    const signals = getHardwareSignals();
    const baseStr = `${signals.uuid}|${signals.motherboard}|${signals.cpuId}`;
    return crypto.createHash('sha256').update(baseStr).digest('hex');
}

module.exports = { getHwid, getHardwareSignals };
