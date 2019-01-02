import { flags } from "@oclif/command";
import envfile from "envfile";
import expandHomeDir from "expand-home-dir";
import { existsSync, writeFileSync } from "fs-extra";
import { BaseCommand } from "../command";

export class EnvSet extends BaseCommand {
    public static description: string = "set a value in the environment";

    public static examples: string[] = [
        `Set the log level
$ ark env:set ARK_LOG_LEVEL info
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsConfig,
        force: flags.boolean({
            char: "f",
            description: "force the setting to be overwritten",
        }),
    };

    public static args: Array<{ name: string; required: boolean; hidden: boolean }> = [
        { name: "key", required: true, hidden: false },
        { name: "value", required: true, hidden: false },
    ];

    public async run(): Promise<void> {
        const { args, flags } = this.parse(EnvSet);

        const envFile = `${expandHomeDir(flags.data)}/.env`;

        if (!existsSync(envFile)) {
            throw new Error(`No environment file found at ${envFile}`);
        }

        const env = envfile.parseFileSync(envFile);

        if (env[args.key] && !flags.force) {
            throw new Error(`The "${args.key}" already exists. If you wish to overwrite it use the --force flag.`);
        }

        env[args.key] = args.value;

        writeFileSync(envFile, envfile.stringifySync(env));
    }
}
