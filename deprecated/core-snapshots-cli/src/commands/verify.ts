import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { flags } from "@oclif/command";
import fs from "fs-extra";
import { setUpLite } from "../utils";
import { BaseCommand } from "./command";

export class VerifyCommand extends BaseCommand {
    public static description: string = "check validity of specified snapshot";

    public static flags = {
        ...BaseCommand.flags,
        blocks: flags.string({
            description: "blocks to verify, correlates to folder name",
        }),
        codec: flags.string({
            description: "codec name, default is msg-lite binary",
        }),
        signatureVerify: flags.boolean({
            description: "signature verification",
        }),
    };

    public async run(): Promise<void> {
        // tslint:disable-next-line:no-shadowed-variable
        const { flags } = this.parse(VerifyCommand);

        await setUpLite(flags);

        await app.resolvePlugin<SnapshotManager>("snapshots").verifyData(flags);
    }
}
