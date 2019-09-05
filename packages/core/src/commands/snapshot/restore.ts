import { app, Container, Contracts } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import Command, { flags } from "@oclif/command";
import cliProgress from "cli-progress";

import { abort } from "../../common/cli";
import { flagsSnapshot } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { chooseSnapshot, setUpLite } from "../../common/snapshot";
import { CommandFlags } from "../../types";

export class RestoreCommand extends Command {
    public static description = "import data from specified snapshot";

    public static flags: CommandFlags = {
        ...flagsSnapshot,
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
        const { flags, paths } = await parseWithNetwork(this.parse(RestoreCommand));

        await setUpLite(flags);

        if (!app.isBound(Container.Identifiers.SnapshotService)) {
            abort("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        if (!flags.blocks) {
            flags.blocks = await chooseSnapshot(paths.data, "What snapshot do you want to restore?");
        }

        const emitter = app.get<Contracts.Kernel.Events.EventDispatcher>(Container.Identifiers.EventDispatcherService);

        const progressBar = new cliProgress.Bar(
            {
                format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total} | Duration: {duration}s",
            },
            cliProgress.Presets.shades_classic,
        );

        /* istanbul ignore next */
        emitter.listen("start", ({ data }) => progressBar.start(data.count, 1));

        /* istanbul ignore next */
        emitter.listen("progress", ({ data }) => progressBar.update(data.value));

        /* istanbul ignore next */
        emitter.listen("complete", () => progressBar.stop());

        await app.get<SnapshotManager>(Container.Identifiers.SnapshotService).import(flags);
    }
}
