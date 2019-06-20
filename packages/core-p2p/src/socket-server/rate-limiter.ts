import { RateLimiterMemory, RLWrapperBlackAndWhite } from "rate-limiter-flexible";

export interface IRateLimiterConfiguration {
    rateLimit: number;
    duration?: number;
}

export interface IEndpointRateLimiterConfiguration extends IRateLimiterConfiguration {
    endpoint: string;
}

export class RateLimiter {
    private global: RateLimiterMemory;
    private endpoints: Map<string, RateLimiterMemory>;

    public constructor({
        whitelist,
        configurations,
    }: {
        whitelist: string[];
        configurations: { global: IRateLimiterConfiguration; endpoints: IEndpointRateLimiterConfiguration[] };
    }) {
        configurations.endpoints = configurations.endpoints || [];

        this.global = this.buildRateLimiter(configurations.global, whitelist);
        this.endpoints = new Map();

        for (const configuration of configurations.endpoints) {
            this.endpoints.set(configuration.endpoint, this.buildRateLimiter(configuration, whitelist));
        }
    }

    public async hasExceededRateLimit(ip: string, requestEndpoint: string): Promise<boolean> {
        let rateLimiter: RateLimiterMemory;

        if (this.endpoints.has(requestEndpoint)) {
            rateLimiter = this.endpoints.get(requestEndpoint);
        } else {
            rateLimiter = this.global;
        }

        try {
            await rateLimiter.consume(ip);
        } catch {
            return true;
        }

        return false;
    }

    private buildRateLimiter(configuration: IRateLimiterConfiguration, whitelist: string[]): RateLimiterMemory {
        return new RLWrapperBlackAndWhite({
            limiter: new RateLimiterMemory({
                points: configuration.rateLimit,
                duration: configuration.duration || 1,
            }),
            whiteList: whitelist,
        });
    }
}
