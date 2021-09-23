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
export declare class RateLimiter {
    private global;
    private endpoints;
    constructor({ whitelist, configurations, }: {
        whitelist: string[];
        configurations: IRateLimiterConfigurations;
    });
    hasExceededRateLimit(ip: string, endpoint?: string): Promise<boolean>;
    getRateLimitedEndpoints(): string[];
    isBlocked(ip: string): Promise<boolean>;
    private buildRateLimiter;
}
