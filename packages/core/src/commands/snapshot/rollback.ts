import { app, Container } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import Command, { flags } from "@oclif/command";

import { abort } from "../../common/cli";
import { flagsSnapshot } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { setUpLite } from "../../common/snapshot";
import { CommandFlags } from "../../types";

export class RollbackCommand extends Command {
    public static description = "rollback chain to specified height";

    public static flags: CommandFlags = {
        ...flagsSnapshot,
        height: flags.integer({
            description: "the height after the roll back",
        }),
        number: flags.integer({
            description: "the number of blocks to roll back",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await parseWithNetwork(this.parse(RollbackCommand));

        await setUpLite(flags);

        if (!app.isBound(Container.Identifiers.SnapshotService)) {
            abort("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        if (flags.height) {
            await app.get<SnapshotManager>(Container.Identifiers.SnapshotService).rollbackByHeight(flags.height);
        } else if (flags.number) {
            await app.get<SnapshotManager>(Container.Identifiers.SnapshotService).rollbackByNumber(flags.number);
        } else {
            abort("Please specify either a height or number of blocks to roll back.");
        }
    }
}
