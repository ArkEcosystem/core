import { flags } from "@oclif/command";
import envfile from "envfile";
import expandHomeDir from "expand-home-dir";
import { existsSync, writeFileSync } from "fs-extra";
import { BaseCommand as Command } from "../command";

export class EnvSet extends Command {
    public static description = "set a value in the environment";

    public static examples = [
        `Set the log level
$ ark env:set ARK_LOG_LEVEL info
`,
    ];

    public static flags = {
        ...Command.flagsConfig,
        force: flags.boolean({
            char: "f",
            description: "force the setting to be overwritten",
        }),
    };

    public static args = [
        { name: "key", required: true, hidden: false },
        { name: "value", required: true, hidden: false },
    ];

    public async run() {
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
