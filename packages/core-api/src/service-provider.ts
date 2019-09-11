import { Server } from "@arkecosystem/core-http-utils";
import { Providers } from "@arkecosystem/core-kernel";

import Handlers from "./handlers";
import { preparePlugins } from "./plugins";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("api.options").toConstantValue(this.config());

        if (this.config().get("server.http.enabled")) {
            await this.buildServer("http");
        }

        if (this.config().get("server.https.enabled")) {
            await this.buildServer("https");
        }
    }

    public async boot(): Promise<void> {
        if (this.config().get("server.http.enabled")) {
            await this.app.get<Server>("api.http").start();
        }

        if (this.config().get("server.https.enabled")) {
            await this.app.get<Server>("api.https").start();
        }
    }

    public async dispose(): Promise<void> {
        if (this.config().get("server.http.enabled")) {
            await this.app.get<Server>("api.http").stop();
        }

        if (this.config().get("server.https.enabled")) {
            await this.app.get<Server>("api.https").stop();
        }
    }

    private async buildServer(type: string): Promise<void> {
        this.app
            .bind<Server>(`api.${type}`)
            .to(Server)
            .inSingletonScope();

        const server: Server = this.app.get<Server>(`api.${type}`);

        await server.init(`Public API (${type.toUpperCase()})`, {
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
