"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const restart_1 = require("../../shared/restart");
const command_1 = require("../command");
class RestartCommand extends restart_1.AbstractRestartCommand {
    getClass() {
        return RestartCommand;
    }
    getSuffix() {
        return "core";
    }
}
exports.RestartCommand = RestartCommand;
RestartCommand.description = "Restart the core";
RestartCommand.examples = [
    `Restart the core
$ ark core:restart
`,
];
RestartCommand.flags = {
    ...command_1.BaseCommand.flagsNetwork,
};
//# sourceMappingURL=restart.js.map