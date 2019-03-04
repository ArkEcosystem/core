import { app } from "@arkecosystem/core-container";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { setUpLite } from "../../helpers/snapshot";
import { BaseCommand } from "../command";

export class TruncateCommand extends BaseCommand {
    public static description: string = "truncate blockchain database";

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(TruncateCommand);

        await setUpLite(flags);

        if (!app.has("snapshots")) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        await app.resolvePlugin<SnapshotManager>("snapshots").truncateChain();
    }
}
