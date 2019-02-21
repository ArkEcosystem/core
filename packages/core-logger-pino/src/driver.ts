import { AbstractLogger } from "@arkecosystem/core-logger";
import "colors";
import isEmpty from "lodash/isEmpty";
import pino from "pino";
import { inspect } from "util";

export class PinoLogger extends AbstractLogger {
    public logger: pino.Logger;
    public silent: boolean = false;

    constructor(readonly options) {
        super(options);
    }

    /**
     * Make the logger instance.
     */
    public make() {
        this.logger = pino(this.options);

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
        this.createLog("trace", message);
    }

    /**
     * Suppress console output.
     * @param  {Boolean}
     * @return {void}
     */
    public suppressConsoleOutput(suppress: boolean): void {
        this.silent = suppress;
    }

    /**
     * Log a message with the given method.
     * @param  {String} method
     * @param  {*} message
     * @return {void}
     */
    private createLog(method: string, message: any): void {
        if (this.silent) {
            return;
        }

        if (isEmpty(message)) {
            return;
        }

        if (typeof message !== "string") {
            message = inspect(message, { depth: 1 });
        }

        this.logger[method](message);
    }
}
