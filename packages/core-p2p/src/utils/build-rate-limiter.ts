import { RateLimiter } from "../rate-limiter";

export const buildRateLimiter = options =>
    new RateLimiter({
        whitelist: [...options.whitelist, ...options.remoteAccess],
        configurations: {
            global: {
                rateLimit: options.rateLimit,
                blockDuration: 60 * 1, // 1 minute ban for now
            },
            endpoints: [
                {
                    rateLimit: 1,
                    endpoint: "p2p.peer.postBlock",
                },
                {
                    rateLimit: 1,
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
                    rateLimit: 5,
                    endpoint: "p2p.peer.getCommonBlocks",
                },
            ],
        },
    });
