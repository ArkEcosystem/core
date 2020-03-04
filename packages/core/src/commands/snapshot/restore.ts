import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { EventEmitter } from "@arkecosystem/core-interfaces";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { flags } from "@oclif/command";
import cliProgress from "cli-progress";
import { chooseSnapshot, setUpLite } from "../../helpers/snapshot";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class RestoreCommand extends BaseCommand {
    public static description: string = "import data from specified snapshot";

    public static flags: CommandFlags = {
        ...BaseCommand.flagsSnapshot,
        blocks: flags.string({
            description: "blocks to import, correlates to folder name",
        }),
        truncate: flags.boolean({
            description: "empty all tables before running import",
        }),
        skipRestartRound: flags.boolean({
            description: "skip revert to current round",
        }),
        verifySignatures: flags.boolean({
            description: "signature verification",
        }),
    };

    public async run(): Promise<void> {
        const { flags, paths } = await this.parseWithNetwork(RestoreCommand);

        this.abortRunningProcess(`${flags.token}-core`);
        this.abortRunningProcess(`${flags.token}-forger`);
        this.abortRunningProcess(`${flags.token}-relay`);

        await setUpLite(flags, paths);

        if (!app.has("snapshots")) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        if (!flags.blocks) {
            try {
                await chooseSnapshot(flags, "What snapshot do you want to restore?");
            } catch (error) {
                this.error(error.message);
            }
        }

        const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

        const progressBar = new cliProgress.Bar(
            {
                format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total} | Duration: {duration}s",
            },
            cliProgress.Presets.shades_classic,
        );

        emitter.on(ApplicationEvents.SnapshotStart, data => {
            progressBar.start(data.count, 1);
        });

        emitter.on(ApplicationEvents.SnapshotProgress, data => {
            progressBar.update(data.value);
        });

        emitter.on(ApplicationEvents.SnapshotComplete, data => {
            progressBar.stop();
        });

        await app.resolvePlugin<SnapshotManager>("snapshots").import(flags);
    }
}
