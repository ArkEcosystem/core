import { app } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { setUpLite } from "../../helpers/snapshot";
import { BaseCommand } from "../command";

export class TruncateCommand extends BaseCommand {
    public static description = "truncate blockchain database";

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(TruncateCommand);

        await setUpLite(flags);

        if (!app.isBound("snapshots")) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        await app.get<SnapshotManager>("snapshots").truncate();
    }
}
