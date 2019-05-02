import { app } from "@arkecosystem/core-container";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { flags } from "@oclif/command";
import { chooseSnapshot, setUpLite } from "../../helpers/snapshot";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class VerifyCommand extends BaseCommand {
    public static description: string = "check validity of specified snapshot";

    public static flags: CommandFlags = {
        ...BaseCommand.flagsSnapshot,
        blocks: flags.string({
            description: "blocks to verify, corelates to folder name",
        }),
        verifySignatures: flags.boolean({
            description: "signature verification",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(VerifyCommand);

        await setUpLite(flags);

        if (!app.has("snapshots")) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        if (!flags.blocks) {
            try {
                await chooseSnapshot(flags, "What snapshot do you want to verify?");
            } catch (error) {
                this.error(error.message);
            }
        }

        await app.resolvePlugin<SnapshotManager>("snapshots").verify(flags);
    }
}
