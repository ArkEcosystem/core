import isEmpty from "lodash.isempty";
import { inspect } from "util";

import { injectable } from "../../ioc";

/**
 * @export
 * @abstract
 * @class Logger
 */
@injectable()
export abstract class Logger {
    /**
     * @private
     * @type {Record<string, string>}
     * @memberof Logger
     */
    private levels: Record<string, string> = {
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
     * @protected
     * @type {boolean}
     * @memberof Logger
     */
    protected silentConsole = false;

    /**
     * @protected
     * @type {*}
     * @memberof Logger
     */
    protected logger: any;

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
        this.log(this.levels.emergency, message);
    }

    /**
     * @param {*} message
     * @memberof Logger
     */
    public alert(message: any): void {
        this.log(this.levels.alert, message);
    }

    /**
     * @param {*} message
     * @memberof Logger
     */
    public critical(message: any): void {
        this.log(this.levels.critical, message);
    }

    /**
     * @param {*} message
     * @memberof Logger
     */
    public error(message: any): void {
        this.log(this.levels.error, message);
    }

    /**
     * @param {*} message
     * @memberof Logger
     */
    public warning(message: any): void {
        this.log(this.levels.warning, message);
    }

    /**
     * @param {*} message
     * @memberof Logger
     */
    public notice(message: any): void {
        this.log(this.levels.notice, message);
    }

    /**
     * @param {*} message
     * @memberof Logger
     */
    public info(message: any): void {
        this.log(this.levels.info, message);
    }

    /**
     * @param {*} message
     * @memberof Logger
     */
    public debug(message: any): void {
        this.log(this.levels.debug, message);
    }

    /**
     * @param {boolean} suppress
     * @memberof Logger
     */
    public suppressConsoleOutput(suppress: boolean): void {
        this.silentConsole = suppress;
    }

    // /**
    //  * @param {Record<string,string>} levels
    //  * @memberof Logger
    //  */
    // public setLevels(levels: Record<string, string>): void {
    //     this.levels = { ...this.levels, ...levels };
    // }
}
