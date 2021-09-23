"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const pretty_bytes_1 = __importDefault(require("pretty-bytes"));
const pretty_ms_1 = __importDefault(require("pretty-ms"));
const command_1 = require("../commands/command");
const process_manager_1 = require("../process-manager");
const utils_1 = require("../utils");
class AbstractStatusCommand extends command_1.BaseCommand {
    async run() {
        const { flags } = await this.parseWithNetwork(this.getClass());
        const processName = `${flags.token}-${this.getSuffix()}`;
        this.abortMissingProcess(processName);
        utils_1.renderTable(["ID", "Name", "Version", "Status", "Uptime", "CPU", "RAM"], (table) => {
            const app = process_manager_1.processManager.describe(processName);
            // @ts-ignore
            table.push([
                app.pid,
                app.name,
                // @ts-ignore
                app.pm2_env.version,
                app.pm2_env.status,
                // @ts-ignore
                pretty_ms_1.default(dayjs_1.default().diff(app.pm2_env.pm_uptime)),
                `${app.monit.cpu}%`,
                pretty_bytes_1.default(app.monit.memory),
            ]);
        });
    }
}
exports.AbstractStatusCommand = AbstractStatusCommand;
//# sourceMappingURL=status.js.map