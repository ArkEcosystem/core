import envfile from "envfile";
import { existsSync } from "fs-extra";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class GetCommand extends BaseCommand {
    public static description: string = "Get the value of an environment variable";

    public static examples: string[] = [
        `Get the log level
$ ark env:get CORE_LOG_LEVEL
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
    };

    public static args: Array<{ name: string; required: boolean; hidden: boolean }> = [
        { name: "key", required: true, hidden: false },
    ];

    public async run(): Promise<void> {
        const { args, paths } = await this.parseWithNetwork(GetCommand);

        const envFile = `${paths.config}/.env`;

        if (!existsSync(envFile)) {
            this.error(`No environment file found at ${envFile}`);
        }

        const env = envfile.parseFileSync(envFile);

        if (!env[args.key]) {
            this.error(`The "${args.key}" doesn't exist.`);
        }

        console.log(env[args.key]);
    }
}
