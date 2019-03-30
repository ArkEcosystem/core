import { Logger } from "@arkecosystem/core-interfaces";
import { AbstractLogger } from "@arkecosystem/core-logger";
import "colors";
import * as winston from "winston";

export class WinstonLogger extends AbstractLogger {
    protected logger: winston.Logger;

    public make(): Logger.ILogger {
        this.logger = winston.createLogger();

        this.registerTransports();

        return this;
    }

    public suppressConsoleOutput(suppress: boolean): void {
        const consoleTransport = this.logger.transports.find((t: any) => t.name === "console");

        if (consoleTransport) {
            consoleTransport.silent = suppress;
        }
    }

    private registerTransports(): void {
        for (const transport of Object.values(this.options.transports)) {
            // @ts-ignore
            if (transport.package) {
                // @ts-ignore
                require(transport.package);
            }

            this.logger.add(
                // @ts-ignore
                new winston.transports[transport.constructor](transport.options),
            );
        }
    }
}
