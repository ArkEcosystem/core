"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_logger_1 = require("@arkecosystem/core-logger");
require("colors");
const winston = __importStar(require("winston"));
class WinstonLogger extends core_logger_1.AbstractLogger {
    make() {
        this.logger = winston.createLogger();
        this.registerTransports();
        return this;
    }
    suppressConsoleOutput(suppress = true) {
        const consoleTransport = this.logger.transports.find((transport) => transport.name === "console");
        if (consoleTransport) {
            consoleTransport.silent = suppress;
        }
    }
    registerTransports() {
        const transports = Object.values(this.options.transports);
        for (const transport of transports) {
            if (transport.package) {
                require(transport.package);
            }
            this.logger.add(new winston.transports[transport.constructor](transport.options));
        }
    }
}
exports.WinstonLogger = WinstonLogger;
//# sourceMappingURL=driver.js.map