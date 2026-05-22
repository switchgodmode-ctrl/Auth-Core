// MUST BE FIRST: Polyfills for Node 16
const { ReadableStream } = require('node:stream/web');
const { Blob } = require('node:buffer');
const os = require('node:os');

if (!globalThis.ReadableStream) {
    globalThis.ReadableStream = ReadableStream;
}
if (!globalThis.Blob) {
    globalThis.Blob = Blob;
}

// Polyfill File using Blob
if (!globalThis.File) {
    globalThis.File = class File extends Blob {
        constructor(parts, filename, options = {}) {
            super(parts, options);
            this.name = filename;
            this.lastModified = options.lastModified || Date.now();
        }
    };
}

// Polyfill AbortSignal.prototype.throwIfAborted
if (globalThis.AbortSignal && !globalThis.AbortSignal.prototype.throwIfAborted) {
    globalThis.AbortSignal.prototype.throwIfAborted = function() {
        if (this.aborted) {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            throw error;
        }
    };
}

// Node 16 doesn't have availableParallelism
if (typeof os.availableParallelism !== 'function') {
    os.availableParallelism = () => {
        return os.cpus().length || 1;
    };
}

// Polyfill toReversed
if (!Array.prototype.toReversed) {
    Array.prototype.toReversed = function() {
        return [...this].reverse();
    };
}

// NOW we can safely require network tools
const { fetch, Request, Response, Headers } = require('undici');
if (!globalThis.fetch) {
    globalThis.fetch = fetch;
    globalThis.Request = Request;
    globalThis.Response = Response;
    globalThis.Headers = Headers;
}

// Finally, start the CLI
require('./node_modules/@expo/cli/build/bin/cli');
