import { Contracts } from "@arkecosystem/core-kernel";

export abstract class AbstractLogger implements Contracts.Logger.ILogger {
    /**
     * Create a new logger instance.
     * @param  {Object} options
     */
    constructor(protected options: any) {}

    /**
     * Make the logger instance.
     * @return {Object}
     */
    public abstract make(): Contracts.Logger.ILogger;

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
     * Log a verbose message.
     * @param  {*} message
     * @return {void}
     */
    public abstract verbose(message: any): void;

    /**
     * Print the progress tracker.
     * @param  {String} title
     * @param  {Number} current
     * @param  {Number} max
     * @param  {String} postTitle
     * @param  {Number} figures
     * @return {void}
     */
    public abstract printTracker(
        title: string,
        current: number,
        max: number,
        postTitle?: string,
        figures?: number,
    ): void;

    /**
     * Stop the progress tracker.
     * @param  {String} title
     * @param  {Number} current
     * @param  {Number} max
     * @return {void}
     */
    public abstract stopTracker(title: string, current: number, max: number): void;

    /**
     * Suppress console output.
     * @param  {Boolean}
     * @return {void}
     */
    public abstract suppressConsoleOutput(suppress: boolean): void;
}
