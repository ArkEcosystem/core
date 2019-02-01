import { app } from "@arkecosystem/core-container";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { setUpLite } from "../utils";
import { BaseCommand } from "./command";

export class TruncateCommand extends BaseCommand {
    public static description: string = "truncate blockchain database";

    public async run(): Promise<void> {
        // tslint:disable-next-line:no-shadowed-variable
        const { flags } = this.parse(TruncateCommand);

        await setUpLite(flags);

        await app.resolvePlugin<SnapshotManager>("snapshots").truncateChain();
    }
}
