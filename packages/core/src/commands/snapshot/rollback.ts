import { app, Container } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { flags } from "@oclif/command";
import { setUpLite } from "../../helpers/snapshot";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class RollbackCommand extends BaseCommand {
    public static description = "rollback chain to specified height";

    public static flags: CommandFlags = {
        ...BaseCommand.flagsSnapshot,
        height: flags.integer({
            description: "the height after the roll back",
        }),
        number: flags.integer({
            description: "the number of blocks to roll back",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(RollbackCommand);

        await setUpLite(flags);

        if (!app.isBound(Container.Identifiers.SnapshotService)) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        if (flags.height) {
            await app.get<SnapshotManager>(Container.Identifiers.SnapshotService).rollbackByHeight(flags.height);
        } else if (flags.number) {
            await app.get<SnapshotManager>(Container.Identifiers.SnapshotService).rollbackByNumber(flags.number);
        } else {
            this.error("Please specify either a height or number of blocks to roll back.");
        }
    }
}
