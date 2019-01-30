import { app } from "@arkecosystem/core-kernel";
import { createHash } from "crypto";
import Hapi from "hapi";

export class ServerCache {
    public static make(server: Hapi.Server): ServerCache {
        return new ServerCache(server);
    }

    private constructor(readonly server: Hapi.Server) {}

    public method(name: string, method: any, expiresIn: number, argsCallback?: any): this {
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
        return createHash("sha256")
            .update(JSON.stringify(value))
            .digest("hex");
    }

    private getCacheTimeout(): number | boolean {
        const { generateTimeout } = app.config("api").cache;

        return JSON.parse(generateTimeout);
    }
}
