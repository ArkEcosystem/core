import { AbstractLogger } from "@arkecosystem/core-logger";
import "colors";
import isEmpty from "lodash.isempty";
import { inspect } from "util";
import * as winston from "winston";

export class WinstonLogger extends AbstractLogger {
    public logger: any;

    /**
     * Make the logger instance.
     */
    public make() {
        this.logger = winston.createLogger();

        this.registerTransports();

        return this;
    }

    /**
     * Log an error message.
     * @param  {*} message
     * @return {void}
     */
    public error(message: any): void {
        this.createLog("error", message);
    }

    /**
     * Log a warning message.
     * @param  {*} message
     * @return {void}
     */
    public warn(message: any): void {
        this.createLog("warn", message);
    }

    /**
     * Log an info message.
     * @param  {*} message
     * @return {void}
     */
    public info(message: any): void {
        this.createLog("info", message);
    }

    /**
     * Log a debug message.
     * @param  {*} message
     * @return {void}
     */
    public debug(message: any): void {
        this.createLog("debug", message);
    }

    /**
     * Log a verbose message.
     * @param  {*} message
     * @return {void}
     */
    public verbose(message: any): void {
        this.createLog("verbose", message);
    }

    /**
     * Suppress console output.
     * @param  {Boolean}
     * @return {void}
     */
    public suppressConsoleOutput(suppress: boolean): void {
        const consoleTransport = this.logger.transports.find(t => t.name === "console");

        if (consoleTransport) {
            consoleTransport.silent = suppress;
        }
    }

    /**
     * Register all transports.
     * @return {void}
     */
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

    /**
     * Log a message with the given method.
     * @param  {String} method
     * @param  {*} message
     * @return {void}
     */
    private createLog(method: string, message: any): void {
        if (isEmpty(message)) {
            return;
        }

        if (typeof message !== "string") {
            message = inspect(message, { depth: 1 });
        }

        this.logger[method](message);
    }
}
