import { app } from "@arkecosystem/core-container";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { flags } from "@oclif/command";
import { setUpLite } from "../../helpers/snapshot";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class DumpCommand extends BaseCommand {
    public static description: string = "create a full snapshot of the database";

    public static flags: CommandFlags = {
        ...BaseCommand.flagsSnapshot,
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
        codec: flags.string({
            description: "codec name, default is msg-lite binary",
        }),
    };

    public async run(): Promise<void> {
        if (!app.has("snapshots")) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        const { flags } = await this.parseWithNetwork(DumpCommand);

        await setUpLite(flags);

        await app.resolvePlugin<SnapshotManager>("snapshots").exportData(flags);
    }
}
