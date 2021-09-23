"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const deepmerge_1 = __importDefault(require("deepmerge"));
const utils_1 = require("../utils");
// tslint:disable-next-line:no-var-requires
const { version } = require("../../package.json");
exports.setUpLite = async (options, paths) => {
    await core_container_1.app.setUp(version, options, deepmerge_1.default(utils_1.getCliConfig(options, paths), {
        options: {
            "@arkecosystem/core-blockchain": { replay: true },
        },
        include: [
            "@arkecosystem/core-event-emitter",
            "@arkecosystem/core-logger-pino",
            "@arkecosystem/core-state",
            "@arkecosystem/core-database-postgres",
            "@arkecosystem/core-blockchain",
        ],
    }));
    return core_container_1.app;
};
//# sourceMappingURL=replay.js.map