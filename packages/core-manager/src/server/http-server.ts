import { Container, Types } from "@arkecosystem/core-kernel";
import { Server as HapiServer } from "@hapi/hapi";

import { Server } from "./server";

@Container.injectable()
export class HttpServer extends Server {
    public async initialize(name: string, serverOptions: Types.JsonObject): Promise<void> {
        this.name = name;
        this.server = new HapiServer(this.getServerOptions(serverOptions));
        this.server.app.app = this.app;

        await this.server.register(this.pluginFactory.preparePlugins());
    }
}
