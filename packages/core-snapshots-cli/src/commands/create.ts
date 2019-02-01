import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { flags } from "@oclif/command";
import fs from "fs-extra";
import { setUpLite } from "../utils";
import { BaseCommand } from "./command";

export class CreateCommand extends BaseCommand {
    public static description: string = "create a full snapshot of the database";

    public static flags = {
        ...BaseCommand.flags,
        blocks: flags.string({
            description: "blocks to append to, correlates to folder name",
            required: true,
        }),
        start: flags.integer({
            description: "start network height to export",
            default: -1,
        }),
        end: flags.integer({
            description: "end network height to export",
            default: 1,
        }),
        codec: flags.string({
            description: "codec name, default is msg-lite binary",
        }),
    };

    public async run(): Promise<void> {
        // tslint:disable-next-line:no-shadowed-variable
        const { flags } = this.parse(CreateCommand);

        await setUpLite(flags);

        // if (flags.filename && !fs.existsSync(flags.filename)) {
        //     app.resolvePlugin<Logger.ILogger>("logger").error(`Appending not possible. Existing snapshot ${flags.filename} not found. Exiting...`);

        //     throw new Error(`Appending not possible. Existing snapshot ${flags.filename} not found. Exiting...`);
        // }

        await app.resolvePlugin<SnapshotManager>("snapshots").exportData(flags);
    }
}
