import { app, Container } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import Command, { flags } from "@oclif/command";

import { abort } from "../../common/cli";
import { flagsSnapshot } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { setUpLite } from "../../common/snapshot";
import { CommandFlags } from "../../types";

export class DumpCommand extends Command {
    public static description = "create a full snapshot of the database";

    public static flags: CommandFlags = {
        ...flagsSnapshot,
        blocks: flags.string({
            description: "blocks to append to, correlates to folder name",
        }),
        start: flags.integer({
            description: "start network height to export",
            default: -1,
        }),
        end: flags.integer({
            description: "end network height to export",
            default: -1,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await parseWithNetwork(this.parse(DumpCommand));

        await setUpLite(flags);

        if (!app.isBound(Container.Identifiers.SnapshotService)) {
            abort("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        await app.get<SnapshotManager>(Container.Identifiers.SnapshotService).dump(flags);
    }
}
