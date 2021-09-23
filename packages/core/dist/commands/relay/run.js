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
        await super.buildApplication(core_container_1.app, flags, deepmerge_1.default(utils_1.getCliConfig(flags, paths), {
            exclude: ["@arkecosystem/core-forger"],
            options: {
                "@arkecosystem/core-p2p": this.buildPeerOptions(flags),
                "@arkecosystem/core-blockchain": {
                    networkStart: flags.networkStart,
                },
            },
        }));
    }
}
exports.RunCommand = RunCommand;
RunCommand.description = "Run the relay (without pm2)";
RunCommand.examples = [
    `Run a relay
$ ark relay:run
`,
    `Run a genesis relay
$ ark relay:run --networkStart
`,
    `Disable any discovery by other peers
$ ark relay:run --disableDiscovery
`,
    `Skip the initial discovery
$ ark relay:run --skipDiscovery
`,
    `Ignore the minimum network reach
$ ark relay:run --ignoreMinimumNetworkReach
`,
    `Start a seed
$ ark relay:run --launchMode=seed
`,
];
RunCommand.flags = {
    ...command_2.BaseCommand.flagsNetwork,
    ...command_2.BaseCommand.flagsBehaviour,
    suffix: command_1.flags.string({
        hidden: true,
        default: "relay",
    }),
    env: command_1.flags.string({
        default: "production",
    }),
};
//# sourceMappingURL=run.js.map