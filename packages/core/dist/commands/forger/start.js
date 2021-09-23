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
        try {
            await this.buildBIP38(flags);
            await this.runWithPm2({
                name: `${flags.token}-forger`,
                // @ts-ignore
                script: this.config.options.root,
                args: `forger:run ${this.flagsToStrings(flags, ["daemon"])}`,
            }, flags);
        }
        catch (error) {
            this.error(error.message);
        }
    }
}
exports.StartCommand = StartCommand;
StartCommand.description = "Start the forger";
StartCommand.examples = [
    `Run a forger with a bip39 passphrase
$ ark forger:start --bip39="..."
`,
    `Run a forger with an encrypted bip38
$ ark forger:start --bip38="..." --password="..."
`,
    `Run a forger without a daemon
$ ark forger:start --no-daemon
`,
];
StartCommand.flags = {
    ...command_2.BaseCommand.flagsNetwork,
    ...command_2.BaseCommand.flagsForger,
    daemon: command_1.flags.boolean({
        description: "start the process as a daemon",
        default: true,
        allowNo: true,
    }),
    env: command_1.flags.string({
        default: "production",
    }),
};
//# sourceMappingURL=start.js.map