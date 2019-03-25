import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { flags } from "@oclif/command";
import { setUpLite } from "../../helpers/snapshot";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class RollbackCommand extends BaseCommand {
    public static description: string = "rollback chain to specified height";

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

        if (!app.has("snapshots")) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        const logger = app.resolvePlugin<Logger.ILogger>("logger");

        if (flags.height === -1) {
            logger.warn("Rollback height is not specified. Rolling back to last completed round.");
        }

        logger.info(`Starting the process of blockchain rollback to block height of ${flags.height.toLocaleString()}`);

        if (flags.height) {
            await app.resolvePlugin<SnapshotManager>("snapshots").rollbackByHeight(flags.height);
        } else if (flags.number) {
            await app.resolvePlugin<SnapshotManager>("snapshots").rollbackByNumber(flags.number);
        } else {
            this.error("Please specify either a height or number of blocks to roll back.");
        }
    }
}
