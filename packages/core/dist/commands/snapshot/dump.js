"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const command_1 = require("@oclif/command");
const snapshot_1 = require("../../helpers/snapshot");
const command_2 = require("../command");
class DumpCommand extends command_2.BaseCommand {
    async run() {
        const { flags, paths } = await this.parseWithNetwork(DumpCommand);
        this.abortRunningProcess(`${flags.token}-core`);
        this.abortRunningProcess(`${flags.token}-forger`);
        this.abortRunningProcess(`${flags.token}-relay`);
        await snapshot_1.setUpLite(flags, paths);
        if (!core_container_1.app.has("snapshots")) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }
        await core_container_1.app.resolvePlugin("snapshots").dump(flags);
    }
}
exports.DumpCommand = DumpCommand;
DumpCommand.description = "create a full snapshot of the database";
DumpCommand.flags = {
    ...command_2.BaseCommand.flagsSnapshot,
    blocks: command_1.flags.string({
        description: "blocks to append to, correlates to folder name",
    }),
    start: command_1.flags.integer({
        description: "start network height to export",
        default: -1,
    }),
    end: command_1.flags.integer({
        description: "end network height to export",
        default: -1,
    }),
};
//# sourceMappingURL=dump.js.map