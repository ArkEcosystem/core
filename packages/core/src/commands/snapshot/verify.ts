import Command, { flags } from "@oclif/command";

import { flagsSnapshot } from "../../common/flags";
import { CommandFlags } from "../../types";

export class VerifyCommand extends Command {
    public static description = "check validity of specified snapshot";

    public static flags: CommandFlags = {
        ...flagsSnapshot,
        blocks: flags.string({
            description: "blocks to verify, correlates to folder name",
        }),
        verifySignatures: flags.boolean({
            description: "signature verification",
        }),
    };

    public async run(): Promise<void> {
        // const { flags, paths } = await parseWithNetwork(this.parse(VerifyCommand));
    }
}
