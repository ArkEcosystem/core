"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const command_1 = require("@oclif/command");
const deepmerge_1 = __importDefault(require("deepmerge"));
const utils_1 = require("../../utils");
const command_2 = require("../command");
class RunCommand extends command_2.BaseCommand {
    async run() {
        const { flags, paths } = await this.parseWithNetwork(RunCommand);
        await this.buildApplication(core_container_1.app, flags, deepmerge_1.default(utils_1.getCliConfig(flags, paths), {
            include: [
                "@arkecosystem/core-event-emitter",
                "@arkecosystem/core-config",
                "@arkecosystem/core-logger",
                "@arkecosystem/core-logger-pino",
                "@arkecosystem/core-forger",
            ],
            options: {
                "@arkecosystem/core-forger": await this.buildBIP38(flags),
            },
        }));
    }
}
exports.RunCommand = RunCommand;
RunCommand.description = "Run the forger (without pm2)";
RunCommand.examples = [
    `Run a forger with a bip39 passphrase
$ ark forger:run --bip39="..."
`,
    `Run a forger with an encrypted bip38
$ ark forger:run --bip38="..." --password="..."
`,
];
RunCommand.flags = {
    ...command_2.BaseCommand.flagsNetwork,
    ...command_2.BaseCommand.flagsForger,
    env: command_1.flags.string({
        default: "production",
    }),
};
//# sourceMappingURL=run.js.map