"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const command_1 = require("@oclif/command");
const snapshot_1 = require("../../helpers/snapshot");
const command_2 = require("../command");
class VerifyCommand extends command_2.BaseCommand {
    async run() {
        const { flags, paths } = await this.parseWithNetwork(VerifyCommand);
        this.abortRunningProcess(`${flags.token}-core`);
        this.abortRunningProcess(`${flags.token}-forger`);
        this.abortRunningProcess(`${flags.token}-relay`);
        await snapshot_1.setUpLite(flags, paths);
        if (!core_container_1.app.has("snapshots")) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }
        if (!flags.blocks) {
            try {
                await snapshot_1.chooseSnapshot(flags, "What snapshot do you want to verify?");
            }
            catch (error) {
                this.error(error.message);
            }
        }
        await core_container_1.app.resolvePlugin("snapshots").verify(flags);
    }
}
exports.VerifyCommand = VerifyCommand;
VerifyCommand.description = "check validity of specified snapshot";
VerifyCommand.flags = {
    ...command_2.BaseCommand.flagsSnapshot,
    blocks: command_1.flags.string({
        description: "blocks to verify, correlates to folder name",
    }),
    verifySignatures: command_1.flags.boolean({
        description: "signature verification",
    }),
};
//# sourceMappingURL=verify.js.map