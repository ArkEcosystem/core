export type ProtocolType = "http" | "https";

export interface ConnectionData {
    ip: string;
    port: number;
    protocol: ProtocolType;
}
