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
            description: "block network height number to rollback",
            default: -1,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(RollbackCommand);

        await setUpLite(flags);

        const logger = app.resolvePlugin<Logger.ILogger>("logger");

        if (flags.height === -1) {
            logger.warn("Rollback height is not specified. Rolling back to last completed round.");
        }

        logger.info(`Starting the process of blockchain rollback to block height of ${flags.height.toLocaleString()}`);

        await app.resolvePlugin<SnapshotManager>("snapshots").rollbackChain(flags.height);
    }
}
