import Command, { flags } from "@oclif/command";

import { flagsSnapshot } from "../../common/flags";
import { CommandFlags } from "../../types";

export class RollbackCommand extends Command {
    public static description = "rollback chain to specified height";

    public static flags: CommandFlags = {
        ...flagsSnapshot,
        height: flags.integer({
            description: "the height after the roll back",
        }),
        number: flags.integer({
            description: "the number of blocks to roll back",
        }),
    };

    public async run(): Promise<void> {
        // const { flags } = await parseWithNetwork(this.parse(RollbackCommand));
    }
}
