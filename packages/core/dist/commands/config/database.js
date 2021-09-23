"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_utils_1 = require("@arkecosystem/core-utils");
const command_1 = require("@oclif/command");
const prompts_1 = __importDefault(require("prompts"));
const utils_1 = require("../../utils");
const command_2 = require("../command");
class DatabaseCommand extends command_2.BaseCommand {
    async run() {
        const { flags, paths } = await this.parseWithNetwork(DatabaseCommand);
        const envFile = `${paths.config}/.env`;
        if (this.hasValidFlag(flags)) {
            utils_1.updateEnvironmentVariables(envFile, this.conform(flags));
            return;
        }
        // Interactive CLI
        const response = await prompts_1.default([
            {
                type: "text",
                name: "host",
                message: "What host do you want to use?",
                initial: "localhost",
            },
            {
                type: "text",
                name: "port",
                message: "What port do you want to use?",
                initial: 5432,
                validate: value => (value < 1 || value > 65535 ? `The port must be in the range of 1-65535.` : true),
            },
            {
                type: "text",
                name: "database",
                message: "What database do you want to use?",
                initial: `${flags.token}_${flags.network}`,
            },
            {
                type: "text",
                name: "username",
                message: "What username do you want to use?",
                initial: flags.token,
            },
            {
                type: "password",
                name: "password",
                message: "What password do you want to use?",
                initial: "password",
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
            },
        ]);
        if (response.confirm) {
            utils_1.updateEnvironmentVariables(envFile, this.conform(response));
        }
    }
    hasValidFlag(flags) {
        return core_utils_1.hasSomeProperty(flags, DatabaseCommand.validFlags);
    }
    conform(flags) {
        const variables = {};
        for (const flag of DatabaseCommand.validFlags) {
            if (flags[flag] !== undefined) {
                variables[`CORE_DB_${flag.toUpperCase()}`] = flags[flag];
            }
        }
        return variables;
    }
}
exports.DatabaseCommand = DatabaseCommand;
DatabaseCommand.description = "Update the Database configuration";
DatabaseCommand.examples = [
    `Set the database host
$ ark config:database --host=localhost
`,
    `Set the database port
$ ark config:database --port=5432
`,
    `Set the name of the database user
$ ark config:database --username=ark
`,
    `Set the database name
$ ark config:database --database=ark_mainnet
`,
    `Set the database password
$ ark config:database --password=password
`,
];
DatabaseCommand.flags = {
    ...command_2.BaseCommand.flagsNetwork,
    host: command_1.flags.string({
        description: "the host of the database",
    }),
    port: command_1.flags.integer({
        description: "the port of the database",
    }),
    database: command_1.flags.string({
        description: "the name of the database that should be used",
    }),
    username: command_1.flags.string({
        description: "the name of the database user",
    }),
    password: command_1.flags.string({
        description: "the password for the database that should be used",
    }),
};
DatabaseCommand.validFlags = ["host", "port", "database", "username", "password"];
//# sourceMappingURL=database.js.map