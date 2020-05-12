import { Container, Contracts, Types } from "@arkecosystem/core-kernel";
import { Server as HapiServer, ServerInjectOptions, ServerInjectResponse } from "@hapi/hapi";
import { readFileSync } from "fs";

import { Plugins } from "../contracts";
import { Identifiers } from "../ioc";

@Container.injectable()
export class Server {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Identifiers.PluginFactory)
    private readonly pluginFactory!: Plugins.PluginFactory;

    private server!: HapiServer;

    private name!: string;

    public async initialize(name: string, serverOptions: Types.JsonObject): Promise<void> {
        this.name = name;
        this.server = new HapiServer(this.getServerOptions(serverOptions));

        await this.server.register(this.pluginFactory.preparePlugins());
    }

    public async inject(options: string | ServerInjectOptions): Promise<ServerInjectResponse> {
        return this.server.inject(options);
    }

    public async boot(): Promise<void> {
        try {
            await this.server.start();

            this.logger.info(`${this.name} Server started at ${this.server.info.uri}`);
        } catch {
            await this.app.terminate(`Failed to start ${this.name} Server!`);
        }
    }

    public async dispose(): Promise<void> {
        try {
            await this.server.stop();

            this.logger.info(`${this.name} Server stopped at ${this.server.info.uri}`);
        } catch {
            await this.app.terminate(`Failed to stop ${this.name} Server!`);
        }
    }

    private getServerOptions(options: Record<string, any>): object {
        options = { ...options };

        delete options.enabled;

        if (options.tls) {
            options.tls.key = readFileSync(options.tls.key).toString();
            options.tls.cert = readFileSync(options.tls.cert).toString();
        }

        return options;
    }
}
