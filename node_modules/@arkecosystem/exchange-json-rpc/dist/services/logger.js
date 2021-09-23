"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
class Logger {
    constructor() {
        this.logger = pino_1.default({
            name: "exchange-json-rpc",
            safe: true,
            prettyPrint: true,
        });
    }
    setLogger(logger) {
        this.logger = logger;
    }
    error(message) {
        this.logger.error(message);
    }
    warn(message) {
        this.logger.warn(message);
    }
    info(message) {
        this.logger.info(message);
    }
    debug(message) {
        this.logger.debug(message);
    }
    verbose(message) {
        this.logger.verbose(message);
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map