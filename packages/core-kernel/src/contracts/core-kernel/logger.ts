import { IApplication } from "./application";

/**
 * @see https://tools.ietf.org/html/rfc5424
 */
export interface ILogger {
    /**
     * Create a new instance of the logger.
     *
     * @param {IApplication} app
     * @returns {Promise<ILogger>}
     * @memberof ILogger
     */
    make(app: IApplication): Promise<ILogger>;

    /**
     * System is unusable.
     *
     * @param {*} message
     * @memberof ILogger
     */
    emergency(message: any): void;

    /**
     * Action must be taken immediately.
     *
     * Example: Entire website down, database unavailable, etc. This should
     * trigger the SMS alerts and wake you up.
     *
     * @param {*} message
     * @memberof ILogger
     */
    alert(message: any): void;

    /**
     * Critical conditions.
     *
     * Example: Application component unavailable, unexpected exception.
     *
     * @param {*} message
     * @memberof ILogger
     */
    critical(message: any): void;

    /**
     * Runtime errors that do not require immediate action but should typically
     * be logged and monitored.
     *
     * @param {*} message
     * @memberof ILogger
     */
    error(message: any): void;

    /**
     * Exceptional occurrences that are not errors.
     *
     * Example: Use of deprecated APIs, poor use of an API, undesirable things
     * that are not necessarily wrong.
     *
     * @param {*} message
     * @memberof ILogger
     */
    warning(message: any): void;

    /**
     * Normal but significant events.
     *
     * @param {*} message
     * @memberof ILogger
     */
    notice(message: any): void;

    /**
     * Interesting events.
     *
     * Example: User logs in, SQL logs.
     *
     * @param {*} message
     * @memberof ILogger
     */
    info(message: any): void;

    /**
     * Detailed debug information.
     *
     * @param {*} message
     * @memberof ILogger
     */
    debug(message: any): void;

    /**
     * Logs with an arbitrary level.
     *
     * @param {string} level
     * @param {*} message
     * @memberof ILogger
     */
    log(level: string, message: any): void;
}
