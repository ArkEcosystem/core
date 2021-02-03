import { RateLimiter } from "../rate-limiter";

export const buildRateLimiter = (options) =>
    new RateLimiter({
        whitelist: [...options.whitelist, ...options.remoteAccess],
        configurations: {
            global: {
                rateLimit: options.rateLimit,
            },
            endpoints: [
                {
                    rateLimit: 2,
                    duration: 4,
                    endpoint: "p2p.blocks.postBlock",
                },
                {
                    rateLimit: 1,
                    duration: 2,
                    endpoint: "p2p.blocks.getBlocks",
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
                {
                    rateLimit: options.rateLimitPostTransactions || 25,
                    endpoint: "p2p.transactions.postTransactions",
                },
            ],
        },
    });
