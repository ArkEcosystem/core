"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const rate_limiter_1 = require("../rate-limiter");
exports.buildRateLimiter = options => {
    if (!options || Object.keys(options).length === 0) {
        options = core_container_1.app.resolveOptions("p2p");
    }
    return new rate_limiter_1.RateLimiter({
        whitelist: [...options.whitelist, ...options.remoteAccess],
        configurations: {
            global: {
                rateLimit: options.rateLimit,
                blockDuration: 60 * 1,
            },
            endpoints: [
                {
                    rateLimit: 2,
                    duration: 4,
                    endpoint: "p2p.peer.postBlock",
                },
                {
                    rateLimit: 1,
                    duration: 2,
                    endpoint: "p2p.peer.getBlocks",
                },
                {
                    rateLimit: 1,
                    endpoint: "p2p.peer.getPeers",
                },
                {
                    rateLimit: 2,
                    endpoint: "p2p.peer.getStatus",
                },
                {
                    rateLimit: 9,
                    endpoint: "p2p.peer.getCommonBlocks",
                },
            ],
        },
    });
};
//# sourceMappingURL=build-rate-limiter.js.map