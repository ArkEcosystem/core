import envfile from "envfile";
import { existsSync } from "fs-extra";
import { BaseCommand } from "../command";

export class GetCommand extends BaseCommand {
    public static description: string = "Get the value of an environment variable";

    public static examples: string[] = [
        `Get the log level
$ ark env:get CORE_LOG_LEVEL
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsConfig,
    };

    public static args: Array<{ name: string; required: boolean; hidden: boolean }> = [
        { name: "key", required: true, hidden: false },
    ];

    public async run(): Promise<void> {
        const { args, flags } = this.parse(GetCommand);
        const { config } = await this.getPaths(flags);

        const envFile = `${config}/.env`;

        if (!existsSync(envFile)) {
            throw new Error(`No environment file found at ${envFile}`);
        }

        const env = envfile.parseFileSync(envFile);

        if (!env[args.key]) {
            throw new Error(`The "${args.key}" doesn't exist.`);
        }

        console.log(env[args.key]);
    }
}
