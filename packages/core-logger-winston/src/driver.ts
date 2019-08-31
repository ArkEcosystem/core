import "colors";

import { Contracts, Services } from "@arkecosystem/core-kernel";
import * as winston from "winston";

import { Transport, TransportStream } from "./interfaces";

export class WinstonLogger extends Services.Log.Logger implements Contracts.Kernel.Log.Logger {
    protected logger: winston.Logger;

    public constructor(private readonly opts: any) {
        super();
    }

    public async make(): Promise<Contracts.Kernel.Log.Logger> {
        this.logger = winston.createLogger();

        this.registerTransports();

        return this;
    }

    public suppressConsoleOutput(suppress = true): void {
        const consoleTransport = this.logger.transports.find(
            (transport: TransportStream) => transport.name === "console",
        );

        if (consoleTransport) {
            consoleTransport.silent = suppress;
        }
    }

    private registerTransports(): void {
        const transports: Transport[] = Object.values(this.opts.transports);

        for (const transport of transports) {
            if (transport.package) {
                require(transport.package);
            }

            this.logger.add(new winston.transports[transport.constructor](transport.options));
        }
    }
}
