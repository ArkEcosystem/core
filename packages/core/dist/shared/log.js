"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clear_1 = __importDefault(require("clear"));
const nodejs_tail_1 = __importDefault(require("nodejs-tail"));
const read_last_lines_1 = __importDefault(require("read-last-lines"));
const command_1 = require("../commands/command");
const process_manager_1 = require("../process-manager");
class AbstractLogCommand extends command_1.BaseCommand {
    async run() {
        const { flags } = await this.parseWithNetwork(this.getClass());
        const processName = `${flags.token}-${this.getSuffix()}`;
        this.abortMissingProcess(processName);
        const { pm2_env } = process_manager_1.processManager.describe(processName);
        const file = flags.error ? pm2_env.pm_err_log_path : pm2_env.pm_out_log_path;
        clear_1.default();
        this.log(`Tailing last ${flags.lines} lines for [${processName}] process (change the value with --lines option)`);
        this.log((await read_last_lines_1.default.read(file, flags.lines)).trim());
        const log = new nodejs_tail_1.default(file);
        log.on("line", this.log);
        log.watch();
    }
}
exports.AbstractLogCommand = AbstractLogCommand;
//# sourceMappingURL=log.js.map