import { LoggerInterface } from "@arkecosystem/core-logger";
import "colors";
import * as winston from "winston";

let tracker = null;

export class Logger extends LoggerInterface {
  public logger: any;

  /**
   * Make the logger instance.
   * @return {Winston.Logger}
   */
  public make() {
    this.logger = winston.createLogger();

    this.__registerTransports();

    this.logger.printTracker = this.printTracker;
    this.logger.stopTracker = this.stopTracker;
    this.logger.suppressConsoleOutput = this.suppressConsoleOutput;

    return this.logger;
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
  public printTracker(title, current, max, postTitle, figures = 0) {
    const progress = (100 * current) / max;

    let line = "\u{1b}[0G  ";
    line += title.blue;
    line += " [";
    line += "=".repeat(Math.floor(progress / 2)).green;
    line += `${" ".repeat(Math.ceil(50 - progress / 2))}] `;
    line += `${progress.toFixed(figures)}% `;

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
  public stopTracker(title, current, max) {
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
  public suppressConsoleOutput(suppress) {
    // @ts-ignore
    const consoleTransport = this.transports.find((t) => t.name === "console");
    if (consoleTransport) {
      consoleTransport.silent = suppress;
    }
  }

  /**
   * Register all transports.
   * @return {void}
   */
  public __registerTransports() {
    // @ts-ignore
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
