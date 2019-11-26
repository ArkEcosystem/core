import Command, { flags } from "@oclif/command";

import { flagsSnapshot } from "../../common/flags";
import { CommandFlags } from "../../types";

export class DumpCommand extends Command {
    public static description = "create a full snapshot of the database";

    public static flags: CommandFlags = {
        ...flagsSnapshot,
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
    };

    public async run(): Promise<void> {
        // const { flags } = await parseWithNetwork(this.parse(DumpCommand));
    }
}
