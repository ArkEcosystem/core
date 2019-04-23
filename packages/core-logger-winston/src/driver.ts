import { Logger } from "@arkecosystem/core-interfaces";
import { AbstractLogger } from "@arkecosystem/core-logger";
import "colors";
import * as winston from "winston";
import { ITransport, ITransportStream } from "./interfaces";

export class WinstonLogger extends AbstractLogger {
    protected logger: winston.Logger;

    public make(): Logger.ILogger {
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
        const transports: ITransport[] = Object.values(this.options.transports);

        for (const transport of transports) {
            if (transport.package) {
                require(transport.package);
            }

            this.logger.add(new winston.transports[transport.constructor](transport.options));
        }
    }
}
