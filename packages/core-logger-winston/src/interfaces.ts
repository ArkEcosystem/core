import WinstonTransportStream from "winston-transport";

export interface TransportStream extends WinstonTransportStream {
    name: string;
}

export interface Transport {
    package?: string;
    constructor: string;
    options: Record<string, any>;
}
