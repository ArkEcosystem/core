import { app } from "@arkecosystem/core-container";
import { Crypto } from "@arkecosystem/crypto";
import Hapi, { ServerMethod } from "@hapi/hapi";

export class ServerCache {
    public static make(server: Hapi.Server): ServerCache {
        return new ServerCache(server);
    }

    private constructor(readonly server: Hapi.Server) {}

    public method(name: string, method: ServerMethod, expiresIn: number, argsCallback?: any): this {
        let options = {};

        // @ts-ignore
        if (this.server.app.config.cache.enabled) {
            options = {
                cache: {
                    expiresIn: expiresIn * 1000,
                    generateTimeout: this.getCacheTimeout(),
                    getDecoratedValue: true,
                },
                generateKey: request => this.generateCacheKey(argsCallback(request)),
            };
        }

        this.server.method(name, method, options);

        return this;
    }

    private generateCacheKey(value: object): string {
        return Crypto.HashAlgorithms.sha256(JSON.stringify(value)).toString("hex");
    }

    private getCacheTimeout(): number | boolean {
        const { generateTimeout } = app.resolveOptions("api").cache;

        return JSON.parse(generateTimeout);
    }
}
