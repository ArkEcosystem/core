import Command from "@oclif/command";

import { flagsNetwork } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { updateEnvironmentVariables } from "../../common/utils";
import { CommandFlags } from "../../types";

export class SetCommand extends Command {
    public static description = "Set the value of an environment variable";

    public static examples: string[] = [
        `Set the log level
$ ark env:set CORE_LOG_LEVEL info
`,
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
    };

    public static args: Array<{ name: string; required: boolean; hidden: boolean }> = [
        { name: "key", required: true, hidden: false },
        { name: "value", required: true, hidden: false },
    ];

    public async run(): Promise<void> {
        const { args, paths } = await parseWithNetwork(this.parse(SetCommand));

        updateEnvironmentVariables(`${paths.config}/.env`, { [args.key]: args.value });
    }
}
