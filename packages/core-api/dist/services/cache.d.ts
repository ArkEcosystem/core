import Hapi, { ServerMethod } from "@hapi/hapi";
export declare class ServerCache {
    readonly server: Hapi.Server;
    static make(server: Hapi.Server): ServerCache;
    private constructor();
    method(name: string, method: ServerMethod, expiresIn: number, argsCallback?: any): this;
    private generateCacheKey;
    private getCacheTimeout;
}
