import { app, Container } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import Command from "@oclif/command";

import { abort } from "../../common/cli";
import { flagsSnapshot } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { setUpLite } from "../../common/snapshot";
import { CommandFlags } from "../../types";

export class TruncateCommand extends Command {
    public static description = "truncate blockchain database";

    public static flags: CommandFlags = {
        ...flagsSnapshot,
    };

    public async run(): Promise<void> {
        const { flags } = await parseWithNetwork(this.parse(TruncateCommand));

        await setUpLite(flags);

        if (!app.isBound(Container.Identifiers.SnapshotService)) {
            abort("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        await app.get<SnapshotManager>(Container.Identifiers.SnapshotService).truncate();
    }
}
