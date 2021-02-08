export interface PeerRateLimiter {
    tryConsumeOutgoing(ip: string, endpoint?: string): Promise<boolean>;
    consumeIncoming(ip: string, endpoint?: string): Promise<boolean>;
}
