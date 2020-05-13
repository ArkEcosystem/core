import { ApplicationFactory } from "@arkecosystem/core-cli";
import { Container, Providers, Types } from "@arkecosystem/core-kernel";

import { ActionReader } from "./action-reader";
import { Identifiers } from "./ioc";
import { PluginFactory } from "./server/plugins";
import { Server } from "./server/server";
import { Argon2id, SimpleTokenValidator } from "./server/validators";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Identifiers.ActionReader).to(ActionReader).inSingletonScope();
        this.app.bind(Identifiers.PluginFactory).to(PluginFactory).inSingletonScope();
        this.app.bind(Identifiers.BasicCredentialsValidator).to(Argon2id).inSingletonScope();
        this.app.bind(Identifiers.TokenValidator).to(SimpleTokenValidator).inSingletonScope();

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
    }

    public async dispose(): Promise<void> {
        if (this.config().get("server.http.enabled")) {
            await this.app.get<Server>(Identifiers.HTTP).dispose();
        }

        if (this.config().get("server.https.enabled")) {
            await this.app.get<Server>(Identifiers.HTTPS).dispose();
        }
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
    }
}
