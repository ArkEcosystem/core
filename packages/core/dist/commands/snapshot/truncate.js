"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const snapshot_1 = require("../../helpers/snapshot");
const command_1 = require("../command");
class TruncateCommand extends command_1.BaseCommand {
    async run() {
        const { flags, paths } = await this.parseWithNetwork(TruncateCommand);
        this.abortRunningProcess(`${flags.token}-core`);
        this.abortRunningProcess(`${flags.token}-forger`);
        this.abortRunningProcess(`${flags.token}-relay`);
        await snapshot_1.setUpLite(flags, paths);
        if (!core_container_1.app.has("snapshots")) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }
        await core_container_1.app.resolvePlugin("snapshots").truncate();
    }
}
exports.TruncateCommand = TruncateCommand;
TruncateCommand.description = "truncate blockchain database";
//# sourceMappingURL=truncate.js.map