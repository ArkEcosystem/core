import { Logger } from "@arkecosystem/core-interfaces";

export abstract class AbstractLogger implements Logger.ILogger {
    /**
     * Create a new logger instance.
     * @param  {Object} options
     */
    constructor(protected options: any) {}

    /**
     * Make the logger instance.
     * @return {Object}
     */
    public abstract make(): Logger.ILogger;

    /**
     * Log an error message.
     * @param  {*} message
     * @return {void}
     */
    public abstract error(message: any): void;

    /**
     * Log a warning message.
     * @param  {*} message
     * @return {void}
     */
    public abstract warn(message: any): void;

    /**
     * Log an info message.
     * @param  {*} message
     * @return {void}
     */
    public abstract info(message: any): void;

    /**
     * Log a debug message.
     * @param  {*} message
     * @return {void}
     */
    public abstract debug(message: any): void;

    /**
     * Suppress console output.
     * @param  {Boolean}
     * @return {void}
     */
    public abstract suppressConsoleOutput(suppress: boolean): void;
}
