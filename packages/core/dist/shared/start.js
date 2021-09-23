"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_ux_1 = __importDefault(require("cli-ux"));
const command_1 = require("../commands/command");
const process_manager_1 = require("../process-manager");
class AbstractStartCommand extends command_1.BaseCommand {
    async run() {
        const { flags } = await this.parseWithNetwork(this.getClass());
        return this.runProcess(flags);
    }
    async runWithPm2(options, flags) {
        const processName = options.name;
        try {
            if (process_manager_1.processManager.has(processName)) {
                this.abortUnknownProcess(processName);
                this.abortRunningProcess(processName);
            }
            cli_ux_1.default.action.start(`Starting ${processName}`);
            const flagsProcess = {
                "max-restarts": 5,
                "kill-timeout": 30000,
            };
            if (flags.daemon === false) {
                flagsProcess["no-daemon"] = true;
            }
            flagsProcess.name = processName;
            process_manager_1.processManager.start({
                ...options,
                ...{
                    env: {
                        NODE_ENV: "production",
                        CORE_ENV: flags.env,
                    },
                },
            }, flagsProcess);
        }
        catch (error) {
            error.stderr ? this.error(`${error.message}: ${error.stderr}`) : this.error(error.message);
        }
        finally {
            cli_ux_1.default.action.stop();
        }
    }
}
exports.AbstractStartCommand = AbstractStartCommand;
//# sourceMappingURL=start.js.map