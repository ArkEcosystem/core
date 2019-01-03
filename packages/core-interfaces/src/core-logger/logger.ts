export interface ILogger {
    /**
     * Make the logger instance.
     * @return {Object}
     */
    make(): ILogger;

    /**
     * Log an error message.
     * @param  {String} message
     * @return {void}
     */
    error(message: string): void;

    /**
     * Log a warning message.
     * @param  {String} message
     * @return {void}
     */
    warn(message: string): void;

    /**
     * Log an info message.
     * @param  {String} message
     * @return {void}
     */
    info(message: string): void;

    /**
     * Log a debug message.
     * @param  {String} message
     * @return {void}
     */
    debug(message: string): void;

    /**
     * Log a verbose message.
     * @param  {String} message
     * @return {void}
     */
    verbose(message: string): void;

    /**
     * Print the progress tracker.
     * @param  {String} title
     * @param  {Number} current
     * @param  {Number} max
     * @param  {String} postTitle
     * @param  {Number} figures
     * @return {void}
     */
    printTracker(title: string, current: number, max: number, postTitle?: string, figures?: number): void;

    /**
     * Stop the progress tracker.
     * @param  {String} title
     * @param  {Number} current
     * @param  {Number} max
     * @return {void}
     */
    stopTracker(title: string, current: number, max: number): void;

    /**
     * Suppress console output.
     * @param  {Boolean}
     * @return {void}
     */
    suppressConsoleOutput(suppress: boolean): void;
}
