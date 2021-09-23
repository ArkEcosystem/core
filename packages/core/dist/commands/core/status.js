"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const status_1 = require("../../shared/status");
const command_1 = require("../command");
class StatusCommand extends status_1.AbstractStatusCommand {
    getClass() {
        return StatusCommand;
    }
    getSuffix() {
        return "core";
    }
}
exports.StatusCommand = StatusCommand;
StatusCommand.description = "Show the core status";
StatusCommand.examples = [`$ ark core:status`];
StatusCommand.flags = {
    ...command_1.BaseCommand.flagsNetwork,
};
//# sourceMappingURL=status.js.map