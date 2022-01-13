import { Providers } from "@arkecosystem/core-kernel";
import Joi from "joi";

import Handlers from "./handlers";
import { Identifiers } from "./identifiers";
import { preparePlugins } from "./plugins";
import { Server } from "./server";
import { DelegateSearchService, LockSearchService, WalletSearchService } from "./services";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Identifiers.WalletSearchService).to(WalletSearchService);
        this.app.bind(Identifiers.DelegateSearchService).to(DelegateSearchService);
        this.app.bind(Identifiers.LockSearchService).to(LockSearchService);

        if (this.config().get("server.http.enabled")) {
            await this.buildServer("http", Identifiers.HTTP);
        }

        if (this.config().get("server.https.enabled")) {
            await this.buildServer("https", Identifiers.HTTPS);
        }
    }

    public async boot(): Promise<void> {
        if (this.config().get("server.http.enabled")) {
            await this.app.get<Server>(Identifiers.HTTP).boot();
        }

        if (this.config().get("server.https.enabled")) {
            await this.app.get<Server>(Identifiers.HTTPS).boot();
        }
    }

    public async dispose(): Promise<void> {
        if (this.config().get("server.http.enabled")) {
            await this.app.get<Server>(Identifiers.HTTP).dispose();
        }

        if (this.config().get("server.https.enabled")) {
            await this.app.get<Server>(Identifiers.HTTPS).dispose();
        }
    }

    public configSchema(): object {
        return Joi.object({
            server: Joi.object({
                http: Joi.object({
                    enabled: Joi.bool().required(),
                    host: Joi.string().required(),
                    port: Joi.number().integer().min(1).max(65535).required(),
                }).required(),
                https: Joi.object({
                    enabled: Joi.bool().required(),
                    host: Joi.string().required(),
                    port: Joi.number().integer().min(1).max(65535).required(),
                    tls: Joi.object({
                        key: Joi.string().when("...enabled", { is: true, then: Joi.required() }),
                        cert: Joi.string().when("...enabled", { is: true, then: Joi.required() }),
                    }).required(),
                }).required(),
            }).required(),
            plugins: Joi.object({
                log: Joi.object({
                    enabled: Joi.bool().required(),
                }).required(),
                cache: Joi.object({
                    enabled: Joi.bool().required(),
                    stdTTL: Joi.number().integer().min(0).required(),
                    checkperiod: Joi.number().integer().min(0).required(),
                }).required(),
                rateLimit: Joi.object({
                    enabled: Joi.bool().required(),
                    points: Joi.number().integer().min(0).required(),
                    duration: Joi.number().integer().min(0).required(),
                    whitelist: Joi.array().items(Joi.string()).required(),
                    blacklist: Joi.array().items(Joi.string()).required(),
                }).required(),
                pagination: Joi.object({
                    limit: Joi.number().integer().min(0).required(),
                }).required(),
                socketTimeout: Joi.number().integer().min(0).required(),
                whitelist: Joi.array().items(Joi.string()).required(),
                trustProxy: Joi.bool().required(),
            }).required(),
            options: Joi.object({
                estimateTotalCount: Joi.bool().required(),
            }).required(),
        }).unknown(true);
    }

    private async buildServer(type: string, id: symbol): Promise<void> {
        this.app.bind<Server>(id).to(Server).inSingletonScope();

        const server: Server = this.app.get<Server>(id);

        await server.initialize(`Public API (${type.toUpperCase()})`, {
            ...this.config().get(`server.${type}`),
            ...{
                routes: {
                    cors: true,
                },
            },
        });

        await server.register(preparePlugins(this.config().get("plugins")));

        await server.register({
            plugin: Handlers,
            routes: { prefix: "/api" },
        });
    }
}
