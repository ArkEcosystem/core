import { AbstractLogger } from "@arkecosystem/core-logger";
import "colors";
import * as winston from "winston";

let tracker = null;

export class Logger extends AbstractLogger {
    public logger: any;

    /**
     * Make the logger instance.
     * @return {Winston.Logger}
     */
    public make(): AbstractLogger {
        this.logger = winston.createLogger();

        this.__registerTransports();

        return this;
    }

    /**
     * Log an error message.
     * @param  {String} message
     * @return {void}
     */
    public error(message: string): void {
        this.logger.error(message);
    }

    /**
     * Log a warning message.
     * @param  {String} message
     * @return {void}
     */
    public warn(message: string): void {
        this.logger.warn(message);
    }

    /**
     * Log an info message.
     * @param  {String} message
     * @return {void}
     */
    public info(message: string): void {
        this.logger.info(message);
    }

    /**
     * Log a debug message.
     * @param  {String} message
     * @return {void}
     */
    public debug(message: string): void {
        this.logger.debug(message);
    }

    /**
     * Log a verbose message.
     * @param  {String} message
     * @return {void}
     */
    public verbose(message: string): void {
        this.logger.verbose(message);
    }

    /**
     * Print the progress tracker.
     * @param  {String} title
     * @param  {Number} current
     * @param  {Number} max
     * @param  {String} postTitle
     * @param  {Number} figures
     * @return {void}
     */
    public printTracker(title: string, current: number, max: number, postTitle: string, figures?: number): void {
        const progress = (100 * current) / max;

        let line = "\u{1b}[0G  ";
        line += title.blue;
        line += " [";
        line += "=".repeat(Math.floor(progress / 2)).green;
        line += `${" ".repeat(Math.ceil(50 - progress / 2))}] `;
        line += `${progress.toFixed(figures || 0)}% `;

        if (postTitle) {
            line += `${postTitle}                     `;
        }

        process.stdout.write(line);

        tracker = line;
    }

    /**
     * Stop the progress tracker.
     * @param  {String} title
     * @param  {Number} current
     * @param  {Number} max
     * @return {void}
     */
    public stopTracker(title: string, current: number, max: number): void {
        let progress = (100 * current) / max;

        if (progress > 100) {
            progress = 100;
        }

        let line = "\u{1b}[0G  ";
        line += title.blue;
        line += " [";
        line += "=".repeat(progress / 2).green;
        line += `${" ".repeat(50 - progress / 2)}] `;
        line += `${progress.toFixed(0)}% `;

        if (current === max) {
            line += "✔️";
        }

        line += "                                                     \n";
        process.stdout.write(line);
        tracker = null;
    }

    /**
     * Suppress console output.
     * @param  {Boolean}
     * @return {void}
     */
    public suppressConsoleOutput(suppress: boolean): void {
        const consoleTransport = this.logger.transports.find(t => t.name === "console");

        if (consoleTransport) {
            consoleTransport.silent = suppress;
        }
    }

    /**
     * Register all transports.
     * @return {void}
     */
    public __registerTransports(): void {
        for (const transport of Object.values(this.options.transports)) {
            // @ts-ignore
            if (transport.package) {
                // @ts-ignore
                require(transport.package);
            }

            this.logger.add(
                // @ts-ignore
                new winston.transports[transport.constructor](transport.options),
            );
        }
    }
}
