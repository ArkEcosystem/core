import envfile from "envfile";
import expandHomeDir from "expand-home-dir";
import { existsSync } from "fs-extra";
import { BaseCommand as Command } from "../command";

export class EnvGet extends Command {
    public static description = "get a value from the environment";

    public static examples = [
        `Get the log level
$ ark env:get ARK_LOG_LEVEL
`,
    ];

    public static flags = {
        ...Command.flagsConfig,
    };

    public static args = [{ name: "key", required: true, hidden: false }];

    public async run() {
        const { args, flags } = this.parse(EnvGet);

        const envFile = `${expandHomeDir(flags.data)}/.env`;

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
