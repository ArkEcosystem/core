import { app, Contracts } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { flags } from "@oclif/command";
import cliProgress from "cli-progress";
import { chooseSnapshot, setUpLite } from "../../helpers/snapshot";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class RestoreCommand extends BaseCommand {
    public static description = "import data from specified snapshot";

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
        const { flags } = await this.parseWithNetwork(RestoreCommand);

        await setUpLite(flags);

        if (!app.ioc.isBound("snapshots")) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        if (!flags.blocks) {
            try {
                await chooseSnapshot(flags, "What snapshot do you want to restore?");
            } catch (error) {
                this.error(error.message);
            }
        }

        const emitter = app.ioc.get<Contracts.Kernel.Events.IEventDispatcher>("events");

        const progressBar = new cliProgress.Bar(
            {
                format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total} | Duration: {duration}s",
            },
            cliProgress.Presets.shades_classic,
        );

        emitter.listen("start", (_, data) => {
            progressBar.start(data.count, 1);
        });

        emitter.listen("progress", (_, data) => {
            progressBar.update(data.value);
        });

        emitter.listen("complete", () => progressBar.stop());

        await app.ioc.get<SnapshotManager>("snapshots").import(flags);
    }
}
