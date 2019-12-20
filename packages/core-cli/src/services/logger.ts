import { Identifiers, inject, injectable } from "../ioc";
import { Output } from "../output";

/**
 * @export
 * @class Logger
 */
@injectable()
export class Logger {
    /**
     * @private
     * @type {Output}
     * @memberof DiscoverCommands
     */
    @inject(Identifiers.Output)
    private readonly output!: Output;

    /**
     * @param {(string | Error)} message
     * @memberof Logger
     */
    public emergency(message: string | Error): void {
        this.log(message, "error");
    }

    /**
     * @param {(string | Error)} message
     * @memberof Logger
     */
    public alert(message: string | Error): void {
        this.log(message, "error");
    }

    /**
     * @param {(string | Error)} message
     * @memberof Logger
     */
    public critical(message: string | Error): void {
        this.log(message, "error");
    }

    /**
     * @param {(string | Error)} message
     * @memberof Logger
     */
    public error(message: string | Error): void {
        this.log(message, "error");
    }

    /**
     * @param {(string | Error)} message
     * @memberof Logger
     */
    public warning(message: string | Error): void {
        this.log(message, "warn");
    }

    /**
     * @param {(string | Error)} message
     * @memberof Logger
     */
    public notice(message: string | Error): void {
        this.log(message, "info");
    }

    /**
     * @param {(string | Error)} message
     * @memberof Logger
     */
    public info(message: string | Error): void {
        this.log(message, "info");
    }

    /**
     * @param {(string | Error)} message
     * @memberof Logger
     */
    public debug(message: string | Error): void {
        this.log(message, "debug");
    }

    /**
     * @param {(string | Error)} message
     * @param {string} [method="log"]
     * @returns {void}
     * @memberof Logger
     */
    public log(message: string | Error, method: string = "log"): void {
        if (this.output.isQuiet()) {
            return;
        }

        console[method](message);
    }
}
