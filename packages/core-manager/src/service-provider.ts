import { ApplicationFactory } from "@arkecosystem/core-cli";
import { Container, Providers, Types } from "@arkecosystem/core-kernel";

import { ActionReader } from "./action-reader";
import { DatabaseService } from "./database-service";
import { Identifiers } from "./ioc";
import { Listener } from "./listener";
import Handlers from "./server/handlers";
import { PluginFactory } from "./server/plugins";
import { Server } from "./server/server";
import { Argon2id, SimpleTokenValidator } from "./server/validators";
import { SnapshotsManager } from "./snapshots/snapshots-manager";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Identifiers.ActionReader).to(ActionReader).inSingletonScope();
        this.app.bind(Identifiers.PluginFactory).to(PluginFactory).inSingletonScope();
        this.app.bind(Identifiers.BasicCredentialsValidator).to(Argon2id).inSingletonScope();
        this.app.bind(Identifiers.TokenValidator).to(SimpleTokenValidator).inSingletonScope();
        this.app.bind(Identifiers.SnapshotsManager).to(SnapshotsManager).inSingletonScope();
        this.app.bind(Identifiers.WatcherDatabaseService).to(DatabaseService).inSingletonScope();
        this.app.bind(Identifiers.EventsListener).to(Listener).inSingletonScope();

        const pkg: Types.PackageJson = require("../package.json");
        this.app.bind(Identifiers.CLI).toConstantValue(ApplicationFactory.make(new Container.Container(), pkg));

        if (this.config().get("server.http.enabled")) {
            await this.buildServer("http", Identifiers.HTTP);
        }

        if (this.config().get("server.https.enabled")) {
            await this.buildServer("https", Identifiers.HTTPS);
        }
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async boot(): Promise<void> {
        if (this.config().get("server.http.enabled")) {
            await this.app.get<Server>(Identifiers.HTTP).boot();
        }

        if (this.config().get("server.https.enabled")) {
            await this.app.get<Server>(Identifiers.HTTPS).boot();
        }

        this.app.get<DatabaseService>(Identifiers.WatcherDatabaseService).boot();
        this.app.get<Listener>(Identifiers.EventsListener).boot();
    }

    public async dispose(): Promise<void> {
        if (this.config().get("server.http.enabled")) {
            await this.app.get<Server>(Identifiers.HTTP).dispose();
        }

        if (this.config().get("server.https.enabled")) {
            await this.app.get<Server>(Identifiers.HTTPS).dispose();
        }

        this.app.get<DatabaseService>(Identifiers.WatcherDatabaseService).dispose();
    }

    public async required(): Promise<boolean> {
        return false;
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
