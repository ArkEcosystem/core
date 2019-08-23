import { Contracts, Services } from "@arkecosystem/core-kernel";
import "colors";
import * as winston from "winston";
import { ITransport, ITransportStream } from "./interfaces";

export class WinstonLogger extends Services.Log.AbstractLogger implements Contracts.Kernel.Log.ILogger {
    protected logger: winston.Logger;

    public constructor(private readonly opts: any) {
        super();
    }

    public async make(): Promise<Contracts.Kernel.Log.ILogger> {
        this.logger = winston.createLogger();

        this.registerTransports();

        return this;
    }

    public suppressConsoleOutput(suppress: boolean = true): void {
        const consoleTransport = this.logger.transports.find(
            (transport: ITransportStream) => transport.name === "console",
        );

        if (consoleTransport) {
            consoleTransport.silent = suppress;
        }
    }

    private registerTransports(): void {
        const transports: ITransport[] = Object.values(this.opts.transports);

        for (const transport of transports) {
            if (transport.package) {
                require(transport.package);
            }

            this.logger.add(new winston.transports[transport.constructor](transport.options));
        }
    }
}
