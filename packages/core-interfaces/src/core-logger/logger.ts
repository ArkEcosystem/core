export interface ILogger {
    /**
     * Make the logger instance.
     * @return {Object}
     */
    make(): ILogger;

    /**
     * Log an error message.
     * @param  {*} message
     * @return {void}
     */
    error(message: any): void;

    /**
     * Log a warning message.
     * @param  {*} message
     * @return {void}
     */
    warn(message: any): void;

    /**
     * Log an info message.
     * @param  {*} message
     * @return {void}
     */
    info(message: any): void;

    /**
     * Log a debug message.
     * @param  {*} message
     * @return {void}
     */
    debug(message: any): void;

    /**
     * Log a verbose message.
     * @param  {*} message
     * @return {void}
     */
    verbose(message: any): void;

    /**
     * Suppress console output.
     * @param  {Boolean}
     * @return {void}
     */
    suppressConsoleOutput(suppress: boolean): void;
}
