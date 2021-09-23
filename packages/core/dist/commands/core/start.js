"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const start_1 = require("../../shared/start");
const command_2 = require("../command");
class StartCommand extends start_1.AbstractStartCommand {
    getClass() {
        return StartCommand;
    }
    async runProcess(flags) {
        this.abortRunningProcess(`${flags.token}-forger`);
        this.abortRunningProcess(`${flags.token}-relay`);
        try {
            await this.buildBIP38(flags);
            await this.runWithPm2({
                name: `${flags.token}-core`,
                // @ts-ignore
                script: this.config.options.root,
                args: `core:run ${this.flagsToStrings(flags, ["daemon"])}`,
            }, flags);
        }
        catch (error) {
            this.error(error.message);
        }
    }
}
exports.StartCommand = StartCommand;
StartCommand.description = "Start the core";
StartCommand.examples = [
    `Run core with a daemon
$ ark core:start
`,
    `Run core as genesis
$ ark core:start --networkStart
`,
    `Disable any discovery by other peers
$ ark core:start --disableDiscovery
`,
    `Skip the initial discovery
$ ark core:start --skipDiscovery
`,
    `Ignore the minimum network reach
$ ark core:start --ignoreMinimumNetworkReach
`,
    `Start a seed
$ ark core:start --launchMode=seed
`,
    `Run core without a daemon
$ ark core:start --no-daemon
`,
];
StartCommand.flags = {
    ...command_2.BaseCommand.flagsNetwork,
    ...command_2.BaseCommand.flagsBehaviour,
    ...command_2.BaseCommand.flagsForger,
    daemon: command_1.flags.boolean({
        description: "start the process as a daemon",
        default: true,
        allowNo: true,
    }),
    suffix: command_1.flags.string({
        hidden: true,
        default: "core",
    }),
    env: command_1.flags.string({
        default: "production",
    }),
};
//# sourceMappingURL=start.js.map