import Command from "@oclif/command";

import { flagsSnapshot } from "../../common/flags";
import { CommandFlags } from "../../types";

export class TruncateCommand extends Command {
    public static description = "truncate blockchain database";

    public static flags: CommandFlags = {
        ...flagsSnapshot,
    };

    public async run(): Promise<void> {
        // const { flags } = await parseWithNetwork(this.parse(TruncateCommand));
    }
}
