"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const database_1 = require("./services/database");
const logger_1 = require("./services/logger");
exports.start = async (options) => {
    database_1.database.connect(options.database);
    if (options.logger) {
        logger_1.logger.setLogger(options.logger);
    }
    return server_1.startServer(options.server);
};
//# sourceMappingURL=index.js.map