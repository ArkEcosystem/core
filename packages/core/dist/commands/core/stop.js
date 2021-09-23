"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const stop_1 = require("../../shared/stop");
const command_2 = require("../command");
class StopCommand extends stop_1.AbstractStopCommand {
    getClass() {
        return StopCommand;
    }
    getSuffix() {
        return "core";
    }
}
exports.StopCommand = StopCommand;
StopCommand.description = "Stop the core";
StopCommand.examples = [
    `Stop the core
$ ark core:stop
`,
    `Stop the core daemon
$ ark core:stop --daemon
`,
];
StopCommand.flags = {
    ...command_2.BaseCommand.flagsNetwork,
    daemon: command_1.flags.boolean({
        description: "stop the process or daemon",
    }),
};
//# sourceMappingURL=stop.js.map