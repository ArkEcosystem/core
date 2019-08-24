import { CommandFlags } from "../../types";
import { updateEnvironmentVariables } from "../../utils";
import { BaseCommand } from "../command";

export class SetCommand extends BaseCommand {
    public static description = "Set the value of an environment variable";

    public static examples: string[] = [
        `Set the log level
$ ark env:set CORE_LOG_LEVEL info
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
    };

    public static args: Array<{ name: string; required: boolean; hidden: boolean }> = [
        { name: "key", required: true, hidden: false },
        { name: "value", required: true, hidden: false },
    ];

    public async run(): Promise<void> {
        const { args, paths } = await this.parseWithNetwork(SetCommand);

        updateEnvironmentVariables(`${paths.config}/.env`, { [args.key]: args.value });
    }
}
