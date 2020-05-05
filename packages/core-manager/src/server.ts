import { Server as HapiServer } from "@hapi/hapi";

import { Container, Contracts, Types } from "@arkecosystem/core-kernel";
import { readFileSync } from "fs";
import { badData } from "@hapi/boom";

@Container.injectable()
export class Server {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    private server: HapiServer;

    private name!: string;

    public async initialize(name: string, optionsServer: Types.JsonObject): Promise<void> {
        this.name = name;
        this.server = new HapiServer(this.getServerOptions(optionsServer));
        this.server.app.app = this.app;

        this.server.ext({
            type: "onPreHandler",
            async method(request, h) {
                request.headers["content-type"] = "application/json";

                return h.continue;
            },
        });

        this.server.route({
            method: "GET",
            path: "/",
            handler() {
                return { data: "Hello World!" };
            },
        });
    }

    public async boot(): Promise<void> {
        try {
            await this.server.start();

            this.app.log.info(`${this.name} Server started at ${this.server.info.uri}`);
        } catch {
            await this.app.terminate(`Failed to start ${this.name} Server!`);
        }
    }

    public async dispose(): Promise<void> {
        try {
            await this.server.stop();

            this.app.log.info(`${this.name} Server stopped at ${this.server.info.uri}`);
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

        return {
            ...{
                router: {
                    stripTrailingSlash: true,
                },
                routes: {
                    payload: {
                        async failAction(request, h, err) {
                            /* istanbul ignore next */
                            return badData(err.message);
                        },
                    },
                    validate: {
                        async failAction(request, h, err) {
                            /* istanbul ignore next */
                            return badData(err.message);
                        },
                    },
                },
            },
            ...options,
        };
    }
}
