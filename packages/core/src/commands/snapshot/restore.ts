import Command, { flags } from "@oclif/command";

import { flagsSnapshot } from "../../common/flags";
import { CommandFlags } from "../../types";

export class RestoreCommand extends Command {
    public static description = "import data from specified snapshot";

    public static flags: CommandFlags = {
        ...flagsSnapshot,
        blocks: flags.string({
            description: "blocks to import, correlates to folder name",
        }),
        truncate: flags.boolean({
            description: "empty all tables before running import",
        }),
        skipRestartRound: flags.boolean({
            description: "skip revert to current round",
        }),
        verifySignatures: flags.boolean({
            description: "signature verification",
        }),
    };

    public async run(): Promise<void> {
        // const { flags, paths } = await parseWithNetwork(this.parse(RestoreCommand));
    }
}
