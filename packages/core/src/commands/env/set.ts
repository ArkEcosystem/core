import { flags } from "@oclif/command";
import envfile from "envfile";
import expandHomeDir from "expand-home-dir";
import { existsSync, writeFileSync } from "fs-extra";
import { BaseCommand } from "../command";

export class SetCommand extends BaseCommand {
    public static description: string = "Set the value of an environment variable";

    public static examples: string[] = [
        `Set the log level
$ ark env:set CORE_LOG_LEVEL info
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
        force: flags.boolean({
            description: "force the setting to be overwritten",
        }),
    };

    public static args: Array<{ name: string; required: boolean; hidden: boolean }> = [
        { name: "key", required: true, hidden: false },
        { name: "value", required: true, hidden: false },
    ];

    public async run(): Promise<void> {
        const { args, flags } = this.parse(SetCommand);
        const { config } = await this.getPaths(flags);

        const envFile = `${config}/.env`;

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
