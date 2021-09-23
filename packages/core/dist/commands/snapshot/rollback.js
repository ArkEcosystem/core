"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const command_1 = require("@oclif/command");
const snapshot_1 = require("../../helpers/snapshot");
const command_2 = require("../command");
class RollbackCommand extends command_2.BaseCommand {
    async run() {
        const { flags, paths } = await this.parseWithNetwork(RollbackCommand);
        this.abortRunningProcess(`${flags.token}-core`);
        this.abortRunningProcess(`${flags.token}-forger`);
        this.abortRunningProcess(`${flags.token}-relay`);
        await snapshot_1.setUpLite(flags, paths);
        if (!core_container_1.app.has("snapshots")) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }
        if (flags.height) {
            await core_container_1.app.resolvePlugin("snapshots").rollbackByHeight(flags.height, flags.export);
        }
        else if (flags.number) {
            await core_container_1.app.resolvePlugin("snapshots").rollbackByNumber(flags.number, flags.export);
        }
        else {
            this.error("Please specify either a height or number of blocks to roll back.");
        }
    }
}
exports.RollbackCommand = RollbackCommand;
RollbackCommand.description = "rollback chain to specified height";
RollbackCommand.flags = {
    ...command_2.BaseCommand.flagsSnapshot,
    height: command_1.flags.integer({
        description: "the height after the roll back",
    }),
    number: command_1.flags.integer({
        description: "the number of blocks to roll back",
    }),
    export: command_1.flags.boolean({
        description: "export the rolled back transactions",
        default: true,
        allowNo: true,
    })
};
//# sourceMappingURL=rollback.js.map