"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const pg_promise_1 = require("pg-promise");
const core_container_1 = require("@arkecosystem/core-container");
const logger = core_container_1.app.resolvePlugin("logger");
exports.loadQueryFile = (directory, file) => {
    const fullPath = path_1.default.join(directory, file);
    const options = {
        minify: true,
        params: {
            schema: "public",
        },
    };
    const query = new pg_promise_1.QueryFile(fullPath, options);
    if (query.error) {
        logger.error(query.error.toString());
    }
    return query;
};
exports.rawQuery = (pgp, queryFile, parameters) => pgp.as.format(queryFile, parameters);
//# sourceMappingURL=index.js.map