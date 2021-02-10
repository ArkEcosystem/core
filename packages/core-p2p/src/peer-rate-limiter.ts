import { Container, Providers } from "@arkecosystem/core-kernel";
import { RateLimiterMemory, RLWrapperBlackAndWhite, RateLimiterAbstract } from "rate-limiter-flexible";

@Container.injectable()
export class PeerRateLimiter {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-p2p")
    private readonly configuration!: Providers.PluginConfiguration;

    private globalIncomingRateLimiter!: RateLimiterAbstract;
    private globalOutgoingRateLimiter!: RateLimiterAbstract;

    private endpointIncomingRateLimiters: Map<string, RateLimiterAbstract> = new Map<string, RateLimiterAbstract>();
    private endpointOutgoingRateLimiters: Map<string, RateLimiterAbstract> = new Map<string, RateLimiterAbstract>();

    @Container.postConstruct()
    public initialize(): void {
        const globalConfig = {
            points: this.configuration.getOptional<number>("rateLimit", 100),
            duration: 1,
        };

        const endpointConfigs = {
            "p2p.blocks.postBlock": { points: 2, duration: 4 },
            "p2p.blocks.getBlocks": { points: 1, duration: 2 },
            "p2p.peer.getPeers": { points: 1 },
            "p2p.peer.getStatus": { points: 2 },
            "p2p.peer.getCommonBlocks": { points: 2 },
            "p2p.transactions.postTransactions": {
                points: this.configuration.getOptional<number>("rateLimitPostTransactions", 100),
            },
        };

        const remoteAccessAddresses = this.configuration.getOptional<string[]>("remoteAccess", []);

        this.globalOutgoingRateLimiter = new RateLimiterMemory(globalConfig);
        this.globalIncomingRateLimiter = new RLWrapperBlackAndWhite({
            limiter: new RateLimiterMemory(globalConfig),
            whiteList: remoteAccessAddresses,
        });

        for (const [endpoint, endpointConfig] of Object.entries(endpointConfigs)) {
            this.endpointOutgoingRateLimiters.set(endpoint, new RateLimiterMemory(endpointConfig));
            this.endpointIncomingRateLimiters.set(
                endpoint,
                new RLWrapperBlackAndWhite({
                    limiter: new RateLimiterMemory(endpointConfig),
                    whiteList: remoteAccessAddresses,
                }),
            );
        }
    }

    public async tryConsumeOutgoing(ip: string, endpoint?: string): Promise<boolean> {
        try {
            await this.globalOutgoingRateLimiter.consume(ip);

            if (endpoint && this.endpointOutgoingRateLimiters.has(endpoint)) {
                const endpointOutgoingRateLimiter: RateLimiterMemory = this.endpointOutgoingRateLimiters.get(endpoint)!;

                try {
                    await endpointOutgoingRateLimiter.consume(ip);
                } catch (error) {
                    await endpointOutgoingRateLimiter.reward(ip);
                    throw error;
                }
            }
        } catch {
            await this.globalOutgoingRateLimiter.reward(ip);
            return false;
        }

        return true;
    }

    public async consumeIncoming(ip: string, endpoint?: string): Promise<boolean> {
        let allowed = true;

        try {
            await this.globalIncomingRateLimiter.consume(ip);
        } catch {
            allowed = false;
        }

        if (endpoint && this.endpointIncomingRateLimiters.has(endpoint)) {
            const endpointRateLimiter: RateLimiterMemory = this.endpointIncomingRateLimiters.get(endpoint)!;

            try {
                await endpointRateLimiter.consume(ip);
            } catch {
                allowed = false;
            }
        }

        return allowed;
    }
}
