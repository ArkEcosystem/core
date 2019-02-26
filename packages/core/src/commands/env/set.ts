import envfile from "envfile";
import { existsSync, writeFileSync } from "fs-extra";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class SetCommand extends BaseCommand {
    public static description: string = "Set the value of an environment variable";

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

        const envFile = `${paths.config}/.env`;

        if (!existsSync(envFile)) {
            this.error(`No environment file found at ${envFile}`);
        }

        const env = envfile.parseFileSync(envFile);

        env[args.key] = args.value;

        writeFileSync(envFile, envfile.stringifySync(env));
    }
}
