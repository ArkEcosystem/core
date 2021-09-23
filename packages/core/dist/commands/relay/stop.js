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
        return "relay";
    }
}
exports.StopCommand = StopCommand;
StopCommand.description = "Stop the relay";
StopCommand.examples = [
    `Stop the relay
$ ark relay:stop
`,
    `Stop the relay daemon
$ ark relay:stop --daemon
`,
];
StopCommand.flags = {
    ...command_2.BaseCommand.flagsNetwork,
    daemon: command_1.flags.boolean({
        description: "stop the process or daemon",
    }),
};
//# sourceMappingURL=stop.js.map