"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const restart_1 = require("../../shared/restart");
const command_1 = require("../command");
class RestartCommand extends restart_1.AbstractRestartCommand {
    getClass() {
        return RestartCommand;
    }
    getSuffix() {
        return "forger";
    }
}
exports.RestartCommand = RestartCommand;
RestartCommand.description = "Restart the forger";
RestartCommand.examples = [
    `Restart the forger
$ ark forger:restart
`,
];
RestartCommand.flags = {
    ...command_1.BaseCommand.flagsNetwork,
};
//# sourceMappingURL=restart.js.map