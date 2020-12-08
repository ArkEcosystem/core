import { ApplicationFactory } from "@arkecosystem/core-cli";
import { Container, Contracts, Providers, Types } from "@arkecosystem/core-kernel";

import { ActionReader } from "./action-reader";
import { DatabaseLogger } from "./database-logger";
import { EventsDatabaseService } from "./database/events-database-service";
import { LogsDatabaseService } from "./database/logs-database-service";
import { Identifiers } from "./ioc";
import { Listener } from "./listener";
import { LogServiceWrapper } from "./log-service-wrapper";
import Handlers from "./server/handlers";
import { PluginFactory } from "./server/plugins";
import { Server } from "./server/server";
import { Argon2id, SimpleTokenValidator } from "./server/validators";
import { SnapshotsManager } from "./snapshots/snapshots-manager";
import { CliManager } from "./utils/cli-manager";

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

        if (this.app.get<any>(Container.Identifiers.ConfigFlags).processType === "manager") {
            this.app.bind(Identifiers.ActionReader).to(ActionReader).inSingletonScope();
            this.app.bind(Identifiers.PluginFactory).to(PluginFactory).inSingletonScope();
            this.app.bind(Identifiers.BasicCredentialsValidator).to(Argon2id).inSingletonScope();
            this.app.bind(Identifiers.TokenValidator).to(SimpleTokenValidator).inSingletonScope();
            this.app.bind(Identifiers.SnapshotsManager).to(SnapshotsManager).inSingletonScope();
            this.app.bind(Identifiers.CliManager).to(CliManager).inSingletonScope();

            const pkg: Types.PackageJson = require("../package.json");
            this.app.bind(Identifiers.CLI).toConstantValue(ApplicationFactory.make(new Container.Container(), pkg));
        }
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async boot(): Promise<void> {
        if (this.app.get<any>(Container.Identifiers.ConfigFlags).processType === "manager") {
            if (this.config().get("server.http.enabled")) {
                await this.buildServer("http", Identifiers.HTTP);
                await this.app.get<Server>(Identifiers.HTTP).boot();
            }

            if (this.config().get("server.https.enabled")) {
                await this.buildServer("https", Identifiers.HTTPS);
                await this.app.get<Server>(Identifiers.HTTPS).boot();
            }
        }

        if (this.config().getRequired<{ enabled: boolean }>("watcher").enabled) {
            this.app.get<Listener>(Identifiers.EventsListener).boot();
        }
    }

    public async dispose(): Promise<void> {
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
        if (this.app.get<any>(Container.Identifiers.ConfigFlags).processType === "manager") {
            return [
                {
                    name: "@arkecosystem/core-snapshots",
                    required: true,
                },
            ];
        }

        return [];
    }

    private async buildServer(type: string, id: symbol): Promise<void> {
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

        await server.register({
            plugin: Handlers,
        });
    }
}
