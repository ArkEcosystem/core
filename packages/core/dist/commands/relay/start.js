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
        this.abortRunningProcess(`${flags.token}-core`);
        await this.runWithPm2({
            name: `${flags.token}-relay`,
            // @ts-ignore
            script: this.config.options.root,
            args: `relay:run ${this.flagsToStrings(flags, ["daemon"])}`,
        }, flags);
    }
}
exports.StartCommand = StartCommand;
StartCommand.description = "Start the relay";
StartCommand.examples = [
    `Run a relay with a pm2 daemon
$ ark relay:start --network=mainnet
`,
    `Run a genesis relay
$ ark relay:start --networkStart
`,
    `Disable any discovery by other peers
$ ark relay:start --disableDiscovery
`,
    `Skip the initial discovery
$ ark relay:start --skipDiscovery
`,
    `Ignore the minimum network reach
$ ark relay:start --ignoreMinimumNetworkReach
`,
    `Start a seed
$ ark relay:start --launchMode=seed
`,
    `Run a relay without a daemon
$ ark relay:start --no-daemon
`,
];
StartCommand.flags = {
    ...command_2.BaseCommand.flagsNetwork,
    ...command_2.BaseCommand.flagsBehaviour,
    daemon: command_1.flags.boolean({
        description: "start the process as a daemon",
        default: true,
        allowNo: true,
    }),
    suffix: command_1.flags.string({
        hidden: true,
        default: "relay",
    }),
    env: command_1.flags.string({
        default: "production",
    }),
};
//# sourceMappingURL=start.js.map