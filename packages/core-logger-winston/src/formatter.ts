import { dato } from "@faustbrian/dato";
import chalk from "chalk";
import { Format } from "logform";
import { format } from "winston";

export const formatter = (colorOutput: boolean = true): Format => {
    const { colorize, combine, timestamp, printf } = format;

    return combine(
        colorize(),
        timestamp(),
        printf(info => {
            // @ts-ignore
            let level: string = info[Symbol.for("level")].toUpperCase();
            let message: string = info.message || JSON.stringify(info.meta);

            if (colorOutput) {
                level = {
                    error: chalk.bold.red(level),
                    warn: chalk.bold.yellow(level),
                    info: chalk.bold.blue(level),
                    verbose: chalk.bold.cyan(level),
                    debug: chalk.bold.white(level),
                    silly: chalk.bold.magenta(level),
                }[level];

                message = {
                    error: chalk.bold.bgRed(message),
                    warn: chalk.bold.black.bgYellow(message),
                    info: message,
                    verbose: chalk.bold.cyan(message),
                    debug: chalk.black.bgWhite(message),
                    silly: chalk.bold.black.bgWhite(message),
                }[level];
            }

            const dateTime: string = dato(info.timestamp).format("YYYY-MM-DD HH:mm:ss");

            return `[${dateTime}][${level}]: ${message}`;
        }),
    );
};
