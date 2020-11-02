export interface NesMessage {
    type?: string; // 0-9
    id?: number;
    path?: string;
    payload?: Buffer;
    statusCode?: number;
    version?: string;
    socket?: string;
    heartbeat?: {
        interval?: number;
        timeout?: number;
    };
}