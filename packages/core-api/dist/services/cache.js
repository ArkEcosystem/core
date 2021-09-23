"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const crypto_1 = require("@arkecosystem/crypto");
class ServerCache {
    constructor(server) {
        this.server = server;
    }
    static make(server) {
        return new ServerCache(server);
    }
    method(name, method, expiresIn, argsCallback) {
        let options = {};
        // @ts-ignore
        if (this.server.app.config.cache.enabled) {
            options = {
                cache: {
                    expiresIn: expiresIn * 1000,
                    generateTimeout: this.getCacheTimeout(),
                    getDecoratedValue: true,
                },
                generateKey: request => this.generateCacheKey(argsCallback(request)),
            };
        }
        this.server.method(name, method, options);
        return this;
    }
    generateCacheKey(value) {
        return crypto_1.Crypto.HashAlgorithms.sha256(JSON.stringify(value)).toString("hex");
    }
    getCacheTimeout() {
        const { generateTimeout } = core_container_1.app.resolveOptions("api").cache;
        return JSON.parse(generateTimeout);
    }
}
exports.ServerCache = ServerCache;
//# sourceMappingURL=cache.js.map