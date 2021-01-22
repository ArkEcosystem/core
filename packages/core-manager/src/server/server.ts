import { Container, Contracts, Types } from "@arkecosystem/core-kernel";
import { Server as HapiServer, ServerInjectOptions, ServerInjectResponse, ServerRoute } from "@hapi/hapi";
import { readFileSync } from "fs";

import { Plugins } from "../contracts";
import { Identifiers } from "../ioc";

@Container.injectable()
export class Server {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Identifiers.PluginFactory)
    protected readonly pluginFactory!: Plugins.PluginFactory;

    protected server!: HapiServer;

    protected name!: string;

    public async initialize(name: string, serverOptions: Types.JsonObject): Promise<void> {
        this.name = name;
        this.server = new HapiServer(this.getServerOptions(serverOptions));
        this.server.app.app = this.app;

        await this.server.register(
            this.pluginFactory.preparePlugins({
                jsonRpcEnabled: true,
            }),
        );

        // Disable 2 minute socket timout
        this.getRoute("POST", "/").settings.timeout.socket = false;
    }

    public async register(plugins: any | any[]): Promise<void> {
        return this.server.register(plugins);
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

    protected getServerOptions(options: Record<string, any>): object {
        options = { ...options };

        delete options.enabled;

        if (options.tls) {
            options.tls.key = readFileSync(options.tls.key).toString();
            options.tls.cert = readFileSync(options.tls.cert).toString();
        }

        return options;
    }

    private getRoute(method: string, path: string): ServerRoute | undefined {
        return this.server.table().find((route) => route.method === method.toLowerCase() && route.path === path);
    }
}
