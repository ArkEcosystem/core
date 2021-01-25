import { ApplicationFactory } from "@arkecosystem/core-cli";
import { Container, Contracts, Providers, Types } from "@arkecosystem/core-kernel";
import { cloneDeep } from "lodash";
import Joi from "joi";

import { ActionReader } from "./action-reader";
import { DatabaseLogger } from "./database-logger";
import { EventsDatabaseService } from "./database/events-database-service";
import { LogsDatabaseService } from "./database/logs-database-service";
import { Identifiers } from "./ioc";
import { Listener } from "./listener";
import { LogServiceWrapper } from "./log-service-wrapper";
import { HttpServer, Server } from "./server";
import Handlers from "./server/handlers";
import { PluginFactory } from "./server/plugins";
import { Argon2id, SimpleTokenValidator } from "./server/validators";
import { SnapshotsManager } from "./snapshots/snapshots-manager";
import { CliManager } from "./utils/cli-manager";
import { WorkerManager } from "./workers/worker-manager";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Identifiers.WatcherDatabaseService).to(EventsDatabaseService).inSingletonScope();
        this.app.get<EventsDatabaseService>(Identifiers.WatcherDatabaseService).boot();

        this.app.bind(Identifiers.LogsDatabaseService).to(LogsDatabaseService).inSingletonScope();
        this.app.get<LogsDatabaseService>(Identifiers.LogsDatabaseService).boot();

        if (this.config().getRequired<{ enabled: boolean }>("watcher").enabled) {
            this.app.bind(Identifiers.EventsListener).to(Listener).inSingletonScope();

            if (this.config().getRequired<boolean>("watcher.watch.queries")) {
                this.app.bind(Container.Identifiers.DatabaseLogger).to(DatabaseLogger).inSingletonScope();
            }
        }

        if (this.config().getRequired<boolean>("logs.enabled")) {
            const logService = this.app.get<Contracts.Kernel.Logger>(Container.Identifiers.LogService);
            this.app
                .rebind(Container.Identifiers.LogService)
                .toConstantValue(
                    new LogServiceWrapper(
                        logService,
                        this.app.get<LogsDatabaseService>(Identifiers.LogsDatabaseService),
                    ),
                );
        }

        if (this.isProcessTypeManager()) {
            this.app.bind(Identifiers.ActionReader).to(ActionReader).inSingletonScope();
            this.app.bind(Identifiers.PluginFactory).to(PluginFactory).inSingletonScope();
            this.app.bind(Identifiers.BasicCredentialsValidator).to(Argon2id).inSingletonScope();
            this.app.bind(Identifiers.TokenValidator).to(SimpleTokenValidator).inSingletonScope();
            this.app.bind(Identifiers.SnapshotsManager).to(SnapshotsManager).inSingletonScope();
            this.app.bind(Identifiers.CliManager).to(CliManager).inSingletonScope();
            this.app.bind(Identifiers.WorkerManager).to(WorkerManager).inSingletonScope();

            const pkg: Types.PackageJson = require("../package.json");
            this.app.bind(Identifiers.CLI).toConstantValue(ApplicationFactory.make(new Container.Container(), pkg));
        }
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async boot(): Promise<void> {
        if (this.isProcessTypeManager()) {
            if (this.config().get("server.http.enabled")) {
                await this.buildJsonRpcServer("http", Identifiers.HTTP_JSON_RPC);
                await this.app.get<Server>(Identifiers.HTTP_JSON_RPC).boot();

                await this.buildServer("http", Identifiers.HTTP);
                await this.app.get<HttpServer>(Identifiers.HTTP).boot();
            }

            if (this.config().get("server.https.enabled")) {
                await this.buildJsonRpcServer("https", Identifiers.HTTPS_JSON_RPC);
                await this.app.get<Server>(Identifiers.HTTPS_JSON_RPC).boot();

                await this.buildServer("https", Identifiers.HTTPS);
                await this.app.get<HttpServer>(Identifiers.HTTPS).boot();
            }
        }

        if (this.config().getRequired<{ enabled: boolean }>("watcher").enabled) {
            this.app.get<Listener>(Identifiers.EventsListener).boot();
        }
    }

    public async dispose(): Promise<void> {
        if (this.app.isBound(Identifiers.HTTP_JSON_RPC)) {
            await this.app.get<Server>(Identifiers.HTTP_JSON_RPC).dispose();
        }

        if (this.app.isBound(Identifiers.HTTPS_JSON_RPC)) {
            await this.app.get<Server>(Identifiers.HTTPS_JSON_RPC).dispose();
        }

        if (this.app.isBound(Identifiers.HTTP)) {
            await this.app.get<Server>(Identifiers.HTTP).dispose();
        }

        if (this.app.isBound(Identifiers.HTTPS)) {
            await this.app.get<Server>(Identifiers.HTTPS).dispose();
        }

        this.app.get<EventsDatabaseService>(Identifiers.WatcherDatabaseService).dispose();
        this.app.get<LogsDatabaseService>(Identifiers.LogsDatabaseService).dispose();
    }

    public async required(): Promise<boolean> {
        return false;
    }

    public dependencies(): Contracts.Kernel.PluginDependency[] {
        if (this.isProcessTypeManager()) {
            return [
                {
                    name: "@arkecosystem/core-snapshots",
                    required: true,
                },
            ];
        }

        return [];
    }

    public configSchema(): object {
        return Joi.object({
            watcher: Joi.object({
                enabled: Joi.bool().required(),
                resetDatabase: Joi.bool().required(),
                storage: Joi.string().required(),
                watch: Joi.object({
                    blocks: Joi.bool().required(),
                    errors: Joi.bool().required(),
                    queries: Joi.bool().required(),
                    queues: Joi.bool().required(),
                    rounds: Joi.bool().required(),
                    schedules: Joi.bool().required(),
                    transactions: Joi.bool().required(),
                    wallets: Joi.bool().required(),
                    webhooks: Joi.bool().required(),
                }).required(),
            }).required(),
            logs: Joi.object({
                enabled: Joi.bool().required(),
                resetDatabase: Joi.bool().required(),
                storage: Joi.string().required(),
                history: Joi.number().min(1).required(),
            }).required(),
            server: Joi.object({
                ip: Joi.number(),
                http: Joi.object({
                    enabled: Joi.bool().required(),
                    host: Joi.string().required(),
                    port: Joi.number().required(),
                }).required(),
                https: Joi.object({
                    enabled: Joi.bool().required(),
                    host: Joi.string().required(),
                    port: Joi.number().required(),
                    tls: Joi.object({
                        key: Joi.string().when("...enabled", { is: true, then: Joi.required() }),
                        cert: Joi.string().when("...enabled", { is: true, then: Joi.required() }),
                    }).required(),
                }).required(),
            }).required(),
            plugins: Joi.object({
                whitelist: Joi.array().items(Joi.string()).required(),
                tokenAuthentication: Joi.object({
                    enabled: Joi.bool().required(),
                    token: Joi.string().when("enabled", { is: true, then: Joi.required() }),
                }).required(),
                basicAuthentication: Joi.object({
                    enabled: Joi.bool().required(),
                    secret: Joi.string().when("enabled", { is: true, then: Joi.required() }),
                    users: Joi.array()
                        .items(
                            Joi.object({
                                username: Joi.string().required(),
                                password: Joi.string().required(),
                            }),
                        )
                        .when("enabled", { is: true, then: Joi.required() }),
                }).required(),
            }).required(),
        });
    }

    private isProcessTypeManager() {
        return this.app.get<any>(Container.Identifiers.ConfigFlags).processType === "manager";
    }

    private async buildServer(type: string, id: symbol): Promise<void> {
        this.app.bind<HttpServer>(id).to(HttpServer).inSingletonScope();

        const server: HttpServer = this.app.get<HttpServer>(id);

        const config = cloneDeep(this.config().getRequired<{ port: number }>(`server.${type}`));
        config.port++;

        await server.initialize(`Public API (${type.toUpperCase()})`, {
            ...config,
            ...{
                routes: {
                    cors: true,
                },
            },
        });

        await server.register({
            plugin: Handlers,
        });
    }

    private async buildJsonRpcServer(type: string, id: symbol): Promise<void> {
        this.app.bind<Server>(id).to(Server).inSingletonScope();

        const server: Server = this.app.get<Server>(id);

        await server.initialize(`Public JSON-RPC API (${type.toUpperCase()})`, {
            ...this.config().get(`server.${type}`),
            ...{
                routes: {
                    cors: true,
                },
            },
        });
    }
}
