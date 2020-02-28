import { Utils } from "@arkecosystem/core-kernel";
import { RateLimiterMemory, RLWrapperBlackAndWhite } from "rate-limiter-flexible";

export interface RateLimiterConfiguration {
    rateLimit: number;
    duration?: number;
    blockDuration?: number;
}

export interface EndpointRateLimiterConfiguration extends RateLimiterConfiguration {
    endpoint: string;
}

export interface RateLimiterConfigurations {
    global: RateLimiterConfiguration;
    endpoints: EndpointRateLimiterConfiguration[];
}

// todo: review the implementation
export class RateLimiter {
    private global: RateLimiterMemory;
    private endpoints: Map<string, RateLimiterMemory>;

    public constructor({
        whitelist,
        configurations,
    }: {
        whitelist: string[];
        configurations: RateLimiterConfigurations;
    }) {
        configurations.endpoints = configurations.endpoints || [];

        this.global = this.buildRateLimiter(configurations.global, whitelist);
        this.endpoints = new Map();

        for (const configuration of configurations.endpoints) {
            this.endpoints.set(configuration.endpoint, this.buildRateLimiter(configuration, whitelist));
        }
    }

    public async hasExceededRateLimit(ip: string, endpoint?: string): Promise<boolean> {
        try {
            await this.global.consume(ip);

            if (endpoint && this.endpoints.has(endpoint)) {
                const rateLimiter: RateLimiterMemory | undefined = this.endpoints.get(endpoint);

                Utils.assert.defined<RateLimiterMemory>(rateLimiter);

                await rateLimiter.consume(ip);
            }
        } catch {
            return true;
        }

        return false;
    }

    public getRateLimitedEndpoints(): string[] {
        return Array.from(this.endpoints.keys());
    }

    public async isBlocked(ip: string): Promise<boolean> {
        const res = await this.global.get(ip);
        return res !== null && res.remainingPoints <= 0;
    }

    private buildRateLimiter(configuration: RateLimiterConfiguration, whitelist: string[]): RateLimiterMemory {
        return new RLWrapperBlackAndWhite({
            limiter: new RateLimiterMemory({
                points: configuration.rateLimit,
                duration: configuration.duration || 1,
                blockDuration: configuration.blockDuration,
            }),
            whiteList: whitelist,
        });
    }
}
