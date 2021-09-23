"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const command_1 = require("@oclif/command");
const replay_1 = require("../../helpers/replay");
const command_2 = require("../command");
class ReplayCommand extends command_2.BaseCommand {
    async run() {
        const { flags, paths } = await this.parseWithNetwork(ReplayCommand);
        await replay_1.setUpLite(flags, paths);
        if (!core_container_1.app.has("blockchain")) {
            this.error("The @arkecosystem/core-blockchain plugin is not installed.");
        }
        await core_container_1.app.resolvePlugin("blockchain").replay(flags.targetHeight);
    }
}
exports.ReplayCommand = ReplayCommand;
ReplayCommand.description = "replay the blockchain from the local database";
ReplayCommand.flags = {
    ...command_2.BaseCommand.flagsNetwork,
    targetHeight: command_1.flags.integer({
        description: "the target height to replay to. If not set, defaults to last block in database.",
        default: -1,
    }),
    suffix: command_1.flags.string({
        hidden: true,
        default: "replay",
    }),
};
//# sourceMappingURL=replay.js.map