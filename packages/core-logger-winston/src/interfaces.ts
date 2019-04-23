import TransportStream from "winston-transport";

export interface ITransportStream extends TransportStream {
    name: string;
}

export interface ITransport {
    package?: string;
    constructor: string;
    options: Record<string, any>;
}
