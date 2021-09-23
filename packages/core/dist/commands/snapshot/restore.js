"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const command_1 = require("@oclif/command");
const cli_progress_1 = __importDefault(require("cli-progress"));
const snapshot_1 = require("../../helpers/snapshot");
const command_2 = require("../command");
class RestoreCommand extends command_2.BaseCommand {
    async run() {
        const { flags, paths } = await this.parseWithNetwork(RestoreCommand);
        this.abortRunningProcess(`${flags.token}-core`);
        this.abortRunningProcess(`${flags.token}-forger`);
        this.abortRunningProcess(`${flags.token}-relay`);
        await snapshot_1.setUpLite(flags, paths);
        if (!core_container_1.app.has("snapshots")) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }
        if (!flags.blocks) {
            try {
                await snapshot_1.chooseSnapshot(flags, "What snapshot do you want to restore?");
            }
            catch (error) {
                this.error(error.message);
            }
        }
        const emitter = core_container_1.app.resolvePlugin("event-emitter");
        const progressBar = new cli_progress_1.default.Bar({
            format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total} | Duration: {duration}s",
        }, cli_progress_1.default.Presets.shades_classic);
        emitter.on(core_event_emitter_1.ApplicationEvents.SnapshotStart, data => {
            progressBar.start(data.count, 1);
        });
        emitter.on(core_event_emitter_1.ApplicationEvents.SnapshotProgress, data => {
            progressBar.update(data.value);
        });
        emitter.on(core_event_emitter_1.ApplicationEvents.SnapshotComplete, data => {
            progressBar.stop();
        });
        await core_container_1.app.resolvePlugin("snapshots").import(flags);
    }
}
exports.RestoreCommand = RestoreCommand;
RestoreCommand.description = "import data from specified snapshot";
RestoreCommand.flags = {
    ...command_2.BaseCommand.flagsSnapshot,
    blocks: command_1.flags.string({
        description: "blocks to import, correlates to folder name",
    }),
    truncate: command_1.flags.boolean({
        description: "empty all tables before running import",
    }),
    skipRestartRound: command_1.flags.boolean({
        description: "skip revert to current round",
    }),
    verifySignatures: command_1.flags.boolean({
        description: "signature verification",
    }),
};
//# sourceMappingURL=restore.js.map