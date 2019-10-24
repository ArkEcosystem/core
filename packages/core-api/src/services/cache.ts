import { app, Container, Providers, Utils } from "@arkecosystem/core-kernel";
import { Crypto } from "@arkecosystem/crypto";
import Hapi, { ServerMethod } from "@hapi/hapi";

// todo: review the implementation
export class ServerCache {
    public static make(server: Hapi.Server): ServerCache {
        return new ServerCache(server);
    }

    private constructor(readonly server: Hapi.Server) {}

    public method(name: string, method: ServerMethod, expiresIn: number, argsCallback?: any): this {
        let options = {};

        if (this.getConfig("plugins.cache.enabled")) {
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
        const config: { generateTimeout: number } = Utils.assert.defined(this.getConfig<any>("plugins.cache"));

        return JSON.parse(`${config.generateTimeout}`);
    }

    private getConfig<T>(key: string): T | undefined {
        return app
            .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
            .get("@arkecosystem/core-api")
            .config()
            .get(key);
    }
}
