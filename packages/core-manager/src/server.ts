import { Server as HapiServer, ServerInjectOptions, ServerInjectResponse } from "@hapi/hapi";
import * as hapiBasic from "@hapi/basic";
import { readFileSync } from "fs";

import { Container, Contracts, Types } from "@arkecosystem/core-kernel";

import { Identifiers } from "./ioc";
import { Plugins, Authentication } from "./contracts";

@Container.injectable()
export class Server {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Identifiers.PluginFactory)
    private readonly pluginFactory!: Plugins.PluginFactory;

    @Container.inject(Identifiers.BasicAuthentication)
    private readonly basicAuthentication!: Authentication.BasicAuthentication;

    private server!: HapiServer;

    private name!: string;

    public async initialize(name: string, serverOptions: Types.JsonObject): Promise<void> {
        this.name = name;
        this.server = new HapiServer(this.getServerOptions(serverOptions));
        // this.server.app.app = this.app;

        await this.server.register(this.pluginFactory.preparePlugins());

        await this.registerBasicAuthentication();
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

    private async registerBasicAuthentication(): Promise<void> {
        await this.server.register(hapiBasic);

        this.server.auth.strategy('simple', 'basic', { validate: async (...params) => {
                // @ts-ignore
                return this.validate(...params)
            } });
        this.server.auth.default('simple');
    }

    private async validate(request, username, password, h) {

        // console.log(request, username, password)

        let isValid = false;

        try {
            isValid = await this.basicAuthentication.validate(username, password);
        } catch (e) {
            this.logger.error(e.stack)
        }

        return { isValid: isValid, credentials: { name: username } };
    }
}
