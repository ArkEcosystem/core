"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const formatter_1 = require("./formatter");
exports.defaults = {
    transports: {
        console: {
            constructor: "Console",
            options: {
                level: process.env.CORE_LOG_LEVEL || "debug",
                format: formatter_1.formatter(true),
                stderrLevels: ["error", "warn"],
            },
        },
        dailyRotate: {
            package: "winston-daily-rotate-file",
            constructor: "DailyRotateFile",
            options: {
                level: process.env.CORE_LOG_LEVEL || "debug",
                format: formatter_1.formatter(false),
                filename: process.env.CORE_LOG_FILE || `${process.env.CORE_PATH_LOG}/%DATE%.log`,
                datePattern: "YYYY-MM-DD",
                zippedArchive: true,
                maxSize: "100m",
                maxFiles: "10",
            },
        },
    },
};
//# sourceMappingURL=defaults.js.map