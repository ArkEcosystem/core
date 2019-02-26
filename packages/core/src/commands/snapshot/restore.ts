import { app } from "@arkecosystem/core-container";
import { EventEmitter } from "@arkecosystem/core-interfaces";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { flags } from "@oclif/command";
import cliProgress from "cli-progress";
import { setUpLite } from "../../helpers/snapshot";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class RestoreCommand extends BaseCommand {
    public static description: string = "import data from specified snapshot";

    public static flags: CommandFlags = {
        ...BaseCommand.flagsSnapshot,
        blocks: flags.string({
            description: "blocks to import, corelates to folder name",
            required: true,
        }),
        codec: flags.string({
            description: "codec name, default is msg-lite binary",
        }),
        truncate: flags.boolean({
            description: "empty all tables before running import",
        }),
        skipRestartRound: flags.boolean({
            description: "skip revert to current round",
        }),
        signatureVerify: flags.boolean({
            description: "signature verification",
        }),
    };

    public async run(): Promise<void> {
        if (!app.has("snapshots")) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        const { flags } = this.parse(RestoreCommand);

        await setUpLite(flags);

        const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

        const progressBar = new cliProgress.Bar(
            {
                format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total} | Duration: {duration}s",
            },
            cliProgress.Presets.shades_classic,
        );

        emitter.on("start", data => {
            progressBar.start(data.count, 1);
        });

        emitter.on("progress", data => {
            progressBar.update(data.value);
        });

        emitter.on("complete", data => {
            progressBar.stop();
        });

        await app.resolvePlugin<SnapshotManager>("snapshots").importData(flags);
    }
}
