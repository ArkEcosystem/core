/**
 * @remarks
 * This interface represents the {@link https://tools.ietf.org/html/rfc5424 | The Syslog Protocol}.
 *
 * @export
 * @interface Logger
 */
export interface Logger {
    /**
     * Create a new instance of the logger.
     *
     * @param {*} options
     * @returns {Promise<Logger>}
     * @memberof Logger
     */
    make(options: any): Promise<Logger>;

    /**
     * System is unusable.
     *
     * @param {*} message
     * @memberof Logger
     */
    emergency(message: any): void;

    /**
     * Action must be taken immediately.
     *
     * Example: Entire website down, database unavailable, etc. This should
     * trigger the SMS alerts and wake you up.
     *
     * @param {*} message
     * @memberof Logger
     */
    alert(message: any): void;

    /**
     * Critical conditions.
     *
     * Example: Application component unavailable, unexpected exception.
     *
     * @param {*} message
     * @memberof Logger
     */
    critical(message: any): void;

    /**
     * Runtime errors that do not require immediate action but should typically
     * be logged and monitored.
     *
     * @param {*} message
     * @memberof Logger
     */
    error(message: any): void;

    /**
     * Exceptional occurrences that are not errors.
     *
     * Example: Use of deprecated APIs, poor use of an API, undesirable things
     * that are not necessarily wrong.
     *
     * @param {*} message
     * @memberof Logger
     */
    warning(message: any): void;

    /**
     * Normal but significant events.
     *
     * @param {*} message
     * @memberof Logger
     */
    notice(message: any): void;

    /**
     * Interesting events.
     *
     * Example: User logs in, SQL logs.
     *
     * @param {*} message
     * @memberof Logger
     */
    info(message: any): void;

    /**
     * Detailed debug information.
     *
     * @param {*} message
     * @memberof Logger
     */
    debug(message: any): void;

    /**
     * Logs with an arbitrary level.
     *
     * @param {string} level
     * @param {*} message
     * @memberof Logger
     */
    log(level: string, message: any): void;

    /**
     * @param {boolean} suppress
     * @memberof Logger
     */
    suppressConsoleOutput(suppress: boolean): void;

    /**
     * @param {Record<string,string>} levels
     * @memberof Logger
     */
    setLevels(levels: Record<string, string>): void;
}
