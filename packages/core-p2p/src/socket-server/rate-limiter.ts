import { RateLimiterMemory, RLWrapperBlackAndWhite } from "rate-limiter-flexible";

export interface IRateLimiterConfiguration {
    rateLimit: number;
    duration?: number;
    blockDuration?: number;
}

export interface IEndpointRateLimiterConfiguration extends IRateLimiterConfiguration {
    endpoint: string;
}

export interface IRateLimiterConfigurations {
    global: IRateLimiterConfiguration;
    endpoints: IEndpointRateLimiterConfiguration[];
}

export class RateLimiter {
    private global: RateLimiterMemory;
    private endpoints: Map<string, RateLimiterMemory>;

    public constructor({
        whitelist,
        configurations,
    }: {
        whitelist: string[];
        configurations: IRateLimiterConfigurations;
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
                await this.endpoints.get(endpoint).consume(ip);
            }
        } catch {
            return true;
        }

        return false;
    }

    public async isBlocked(ip: string): Promise<boolean> {
        const res = await this.global.get(ip);
        return res !== null && res.remainingPoints <= 0;
    }

    private buildRateLimiter(configuration: IRateLimiterConfiguration, whitelist: string[]): RateLimiterMemory {
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
