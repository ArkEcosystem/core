"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_ux_1 = __importDefault(require("cli-ux"));
const command_1 = require("../commands/command");
const process_manager_1 = require("../process-manager");
class AbstractStopCommand extends command_1.BaseCommand {
    async run() {
        const { flags } = await this.parseWithNetwork(this.getClass());
        const processName = `${flags.token}-${this.getSuffix()}`;
        try {
            this.abortMissingProcess(processName);
            this.abortUnknownProcess(processName);
            this.abortStoppedProcess(processName);
            cli_ux_1.default.action.start(`Stopping ${processName}`);
            process_manager_1.processManager[flags.daemon ? "delete" : "stop"](processName);
        }
        catch (error) {
            this.error(error.message);
        }
        finally {
            cli_ux_1.default.action.stop();
        }
    }
}
exports.AbstractStopCommand = AbstractStopCommand;
//# sourceMappingURL=stop.js.map