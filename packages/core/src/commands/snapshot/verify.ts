import { app } from "@arkecosystem/core-container";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { flags } from "@oclif/command";
import { setUpLite } from "../../helpers/snapshot";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class VerifyCommand extends BaseCommand {
    public static description: string = "check validity of specified snapshot";

    public static flags: CommandFlags = {
        ...BaseCommand.flagsSnapshot,
        blocks: flags.string({
            description: "blocks to verify, corelates to folder name",
        }),
        codec: flags.string({
            description: "codec name, default is msg-lite binary",
        }),
        signatureVerify: flags.boolean({
            description: "signature verification",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(VerifyCommand);

        await setUpLite(flags);

        await app.resolvePlugin<SnapshotManager>("snapshots").verifyData(flags);
    }
}
