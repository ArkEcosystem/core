import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Crypto } from "@arkecosystem/crypto";
import Hapi, { ServerMethod } from "@hapi/hapi";

// todo: review the implementation
@Container.injectable()
export class ServerCache {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    private server: Hapi.Server;

    public make(server: Hapi.Server): ServerCache {
        this.server = server;

        return this;
    }

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
        const config: { generateTimeout: number } = this.getConfig<any>("plugins.cache");

        return JSON.parse(`${config.generateTimeout}`);
    }

    private getConfig<T>(key: string): T | undefined {
        return this.app
            .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
            .get("@arkecosystem/core-api")
            .config()
            .get(key);
    }
}
