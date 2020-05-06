import { Server as HapiServer, ServerInjectOptions, ServerInjectResponse } from "@hapi/hapi";
import * as rpc from "@hapist/json-rpc";

import { readFileSync } from "fs";

import { Container, Contracts, Types } from "@arkecosystem/core-kernel";
import { Validation } from "@arkecosystem/crypto";

import { Identifiers } from "./ioc";
import { ActionReader } from "./action-reader";

@Container.injectable()
export class Server {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Identifiers.ActionReader)
    private readonly actionReader!: ActionReader;

    private server: HapiServer;

    private name!: string;

    public async initialize(name: string, optionsServer: Types.JsonObject): Promise<void> {
        this.name = name;
        this.server = new HapiServer(this.getServerOptions(optionsServer));
        this.server.app.app = this.app;

        await this.server.register({
            plugin: rpc,
            options: {
                methods: this.actionReader.discoverActions(),
                processor: {
                    schema: {
                        properties: {
                            id: {
                                type: ["number", "string"],
                            },
                            jsonrpc: {
                                pattern: "2.0",
                                type: "string",
                            },
                            method: {
                                type: "string",
                            },
                            params: {
                                type: "object",
                            },
                        },
                        required: ["jsonrpc", "method", "id"],
                        type: "object",
                    },
                    validate(data: object, schema: object) {
                        try {
                            const { error } = Validation.validator.validate(schema, data);
                            return { value: data, error: error ? error : null };
                        } catch (error) {
                            return { value: null, error: error.stack };
                        }
                    },
                },
            },
        });
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
