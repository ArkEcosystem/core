import Hapi from "@hapi/hapi";
export declare class Server {
    private config;
    private logger;
    private http;
    private https;
    constructor(config: any);
    start(): Promise<void>;
    stop(): Promise<void>;
    restart(): Promise<void>;
    instance(type: string): Hapi.Server;
    private registerPlugins;
}
