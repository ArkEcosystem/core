import chalk from "chalk";
import dayjs from "dayjs-ext";
import emoji from "node-emoji";
import { format } from "winston";

const { colorize, combine, timestamp, printf } = format;

const formatter = (colorOutput: boolean = true) =>
    combine(
        colorize(),
        timestamp(),
        printf(info => {
            // @ts-ignore
            const infoLevel = info[Symbol.for("level")];

            let level = infoLevel.toUpperCase();
            let message = emoji.emojify(info.message) || JSON.stringify(info.meta);

            if (colorOutput) {
                level = {
                    error: chalk.bold.red(level),
                    warn: chalk.bold.yellow(level),
                    info: chalk.bold.blue(level),
                    verbose: chalk.bold.cyan(level),
                    debug: chalk.bold.white(level),
                    silly: chalk.bold.magenta(level),
                }[infoLevel];

                message = {
                    error: chalk.bold.bgRed(message),
                    warn: chalk.bold.black.bgYellow(message),
                    info: message,
                    verbose: chalk.bold.cyan(message),
                    debug: chalk.black.bgWhite(message),
                    silly: chalk.bold.black.bgWhite(message),
                }[infoLevel];
            }

            const dateTime = dayjs(info.timestamp).format("YYYY-MM-DD HH:mm:ss");

            return `[${dateTime}][${level}]: ${message}`;
        }),
    );

export { formatter };
