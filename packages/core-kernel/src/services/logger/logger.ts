import isEmpty from "lodash.isempty";
import { inspect } from "util";
import { ILogger } from "../../contracts/core-kernel/logger";

/**
 * @export
 * @abstract
 * @class AbstractLogger
 * @implements {ILogger}
 */
export abstract class AbstractLogger implements ILogger {
    /**
     * @protected
     * @type {*}
     * @memberof AbstractLogger
     */
    protected logger: any;

    /**
     * @protected
     * @type {boolean}
     * @memberof AbstractLogger
     */
    protected silentConsole: boolean = false;

    /**
     * @protected
     * @type {Record<string, string>}
     * @memberof AbstractLogger
     */
    protected readonly defaultLevels: Record<string, string> = {
        emergency: "emergency",
        alert: "alert",
        critical: "critical",
        error: "error",
        warning: "warning",
        notice: "notice",
        info: "info",
        debug: "debug",
    };

    /**
     * @param {Record<string, any>} options
     * @memberof AbstractLogger
     */
    constructor(protected readonly options: Record<string, any>) {}

    /**
     * @abstract
     * @returns {ILogger}
     * @memberof AbstractLogger
     */
    public abstract make(): ILogger;

    /**
     * @param {string} level
     * @param {*} message
     * @returns {boolean}
     * @memberof AbstractLogger
     */
    public log(level: string, message: any): boolean {
        if (this.silentConsole) {
            return false;
        }

        if (isEmpty(message)) {
            return false;
        }

        if (typeof message !== "string") {
            message = inspect(message, { depth: 1 });
        }

        this.logger[level](message);

        return true;
    }

    /**
     * @param {*} message
     * @memberof AbstractLogger
     */
    public emergency(message: any): void {
        this.log(this.getLevel("emergency"), message);
    }

    /**
     * @param {*} message
     * @memberof AbstractLogger
     */
    public alert(message: any): void {
        this.log(this.getLevel("alert"), message);
    }

    /**
     * @param {*} message
     * @memberof AbstractLogger
     */
    public critical(message: any): void {
        this.log(this.getLevel("critical"), message);
    }

    /**
     * @param {*} message
     * @memberof AbstractLogger
     */
    public error(message: any): void {
        this.log(this.getLevel("error"), message);
    }

    /**
     * @param {*} message
     * @memberof AbstractLogger
     */
    public warning(message: any): void {
        this.log(this.getLevel("warning"), message);
    }

    /**
     * @param {*} message
     * @memberof AbstractLogger
     */
    public notice(message: any): void {
        this.log(this.getLevel("notice"), message);
    }

    /**
     * @param {*} message
     * @memberof AbstractLogger
     */
    public info(message: any): void {
        this.log(this.getLevel("info"), message);
    }

    /**
     * @param {*} message
     * @memberof AbstractLogger
     */
    public debug(message: any): void {
        this.log(this.getLevel("debug"), message);
    }

    /**
     * @param {boolean} [suppress=true]
     * @memberof AbstractLogger
     */
    public suppressConsoleOutput(suppress: boolean = true): void {
        this.silentConsole = suppress;
    }

    /**
     * @protected
     * @param {string} level
     * @returns {string}
     * @memberof AbstractLogger
     */
    protected getLevel(level: string): string {
        return { ...this.defaultLevels, ...this.getLevels() }[level];
    }

    /**
     * @protected
     * @returns {Record<string, string>}
     * @memberof AbstractLogger
     */
    protected getLevels(): Record<string, string> {
        return this.defaultLevels;
    }
}
