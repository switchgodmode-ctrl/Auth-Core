import { webcrypto } from 'node:crypto';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vitePath = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');

const child = spawn('node', [vitePath], {
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: '--require ' + path.join(__dirname, 'polyfill.cjs') }
});

child.on('exit', (code) => {
    process.exit(code);
});
