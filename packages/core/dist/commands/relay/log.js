"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const log_1 = require("../../shared/log");
const command_2 = require("../command");
class LogCommand extends log_1.AbstractLogCommand {
    getClass() {
        return LogCommand;
    }
    getSuffix() {
        return "relay";
    }
}
exports.LogCommand = LogCommand;
LogCommand.description = "Show the relay log";
LogCommand.examples = [`$ ark relay:log`];
LogCommand.flags = {
    ...command_2.BaseCommand.flagsNetwork,
    error: command_1.flags.boolean({
        description: "only show error output",
    }),
    lines: command_1.flags.integer({
        description: "number of lines to tail",
        default: 15,
    }),
};
//# sourceMappingURL=log.js.map