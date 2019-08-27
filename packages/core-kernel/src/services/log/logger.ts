import isEmpty from "lodash.isempty";
import { inspect } from "util";
import { injectable } from "../../container";

/**
 * @export
 * @abstract
 * @class Logger
 */
@injectable()
export abstract class Logger {
    /**
     * @protected
     * @type {*}
     * @memberof Logger
     */
    protected logger: any;

    /**
     * @protected
     * @type {boolean}
     * @memberof Logger
     */
    protected silentConsole = false;

    /**
     * @protected
     * @type {Record<string, string>}
     * @memberof Logger
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
     * @param {string} level
     * @param {*} message
     * @returns {boolean}
     * @memberof Logger
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
     * @memberof Logger
     */
    public emergency(message: any): void {
        this.log(this.getLevel("emergency"), message);
    }

    /**
     * @param {*} message
     * @memberof Logger
     */
    public alert(message: any): void {
        this.log(this.getLevel("alert"), message);
    }

    /**
     * @param {*} message
     * @memberof Logger
     */
    public critical(message: any): void {
        this.log(this.getLevel("critical"), message);
    }

    /**
     * @param {*} message
     * @memberof Logger
     */
    public error(message: any): void {
        this.log(this.getLevel("error"), message);
    }

    /**
     * @param {*} message
     * @memberof Logger
     */
    public warning(message: any): void {
        this.log(this.getLevel("warning"), message);
    }

    /**
     * @param {*} message
     * @memberof Logger
     */
    public notice(message: any): void {
        this.log(this.getLevel("notice"), message);
    }

    /**
     * @param {*} message
     * @memberof Logger
     */
    public info(message: any): void {
        this.log(this.getLevel("info"), message);
    }

    /**
     * @param {*} message
     * @memberof Logger
     */
    public debug(message: any): void {
        this.log(this.getLevel("debug"), message);
    }

    /**
     * @param {boolean} [suppress=true]
     * @memberof Logger
     */
    public suppressConsoleOutput(suppress = true): void {
        this.silentConsole = suppress;
    }

    /**
     * @protected
     * @param {string} level
     * @returns {string}
     * @memberof Logger
     */
    protected getLevel(level: string): string {
        return { ...this.defaultLevels, ...this.getLevels() }[level];
    }

    /**
     * @protected
     * @returns {Record<string, string>}
     * @memberof Logger
     */
    protected getLevels(): Record<string, string> {
        return this.defaultLevels;
    }
}
