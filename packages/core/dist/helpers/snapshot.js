"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const deepmerge_1 = __importDefault(require("deepmerge"));
const fs_1 = require("fs");
const prompts_1 = __importDefault(require("prompts"));
const utils_1 = require("../utils");
// tslint:disable-next-line:no-var-requires
const { version } = require("../../package.json");
exports.setUpLite = async (options, paths) => {
    await core_container_1.app.setUp(version, options, deepmerge_1.default(utils_1.getCliConfig(options, paths), {
        include: [
            "@arkecosystem/core-event-emitter",
            "@arkecosystem/core-logger-pino",
            "@arkecosystem/core-state",
            "@arkecosystem/core-database-postgres",
            "@arkecosystem/core-snapshots",
        ],
    }));
    return core_container_1.app;
};
exports.chooseSnapshot = async (flags, message) => {
    const source = `${process.env.CORE_PATH_DATA}/snapshots`;
    const snapshots = fs_1.readdirSync(source).filter((name) => fs_1.lstatSync(`${source}/${name}`).isDirectory());
    if (!snapshots) {
        throw new Error("Failed to find any snapshots.");
    }
    if (snapshots.length === 1) {
        flags.blocks = snapshots[0];
        return;
    }
    const response = await prompts_1.default([
        {
            type: "select",
            name: "blocks",
            message,
            choices: snapshots.map((name) => ({ title: name, value: name })),
        },
        {
            type: "confirm",
            name: "confirm",
            message: "Can you confirm?",
        },
    ]);
    if (!response.blocks || !response.confirm) {
        throw new Error("Please select a snapshot and try again.");
    }
    flags.blocks = response.blocks;
};
//# sourceMappingURL=snapshot.js.map