"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const pretty_bytes_1 = __importDefault(require("pretty-bytes"));
const pretty_ms_1 = __importDefault(require("pretty-ms"));
const process_manager_1 = require("../process-manager");
const utils_1 = require("../utils");
const command_1 = require("./command");
class TopCommand extends command_1.BaseCommand {
    async run() {
        const { flags } = await this.parseWithNetwork(TopCommand);
        const processes = process_manager_1.processManager
            .list()
            .filter((p) => p.name.startsWith(flags.token));
        if (!processes || !Object.keys(processes).length) {
            this.warn("No processes are running.");
            return;
        }
        utils_1.renderTable(["ID", "Name", "Version", "Status", "Uptime", "CPU", "RAM"], (table) => {
            for (const process of processes) {
                // @ts-ignore
                table.push([
                    process.pid,
                    process.name,
                    // @ts-ignore
                    process.pm2_env.version,
                    process.pm2_env.status,
                    // @ts-ignore
                    pretty_ms_1.default(dayjs_1.default().diff(process.pm2_env.pm_uptime)),
                    `${process.monit.cpu}%`,
                    pretty_bytes_1.default(process.monit.memory),
                ]);
            }
        });
    }
}
exports.TopCommand = TopCommand;
TopCommand.description = "List all core daemons";
TopCommand.examples = [
    `List all core daemons
$ ark top
`,
];
TopCommand.flags = {
    ...command_1.BaseCommand.flagsNetwork,
};
//# sourceMappingURL=top.js.map