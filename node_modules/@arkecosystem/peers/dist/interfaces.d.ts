export interface IPeer {
    ip: string;
    port: number;
    ports?: Record<string, number>;
    version?: string;
    height?: number;
    latency?: number;
}
export interface IPeerResponse {
    ip: string;
    port: number;
    ports: Record<string, number>;
    version: string;
    height: number;
    latency: number;
}
