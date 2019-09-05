import Command from "@oclif/command";
import envfile from "envfile";
import { existsSync } from "fs-extra";

import { abort } from "../../common/cli";
import { flagsNetwork } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { CommandFlags } from "../../types";

export class GetCommand extends Command {
    public static description = "Get the value of an environment variable";

    public static examples: string[] = [
        `Get the log level
$ ark env:get CORE_LOG_LEVEL
`,
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
    };

    public static args: Array<{ name: string; required: boolean; hidden: boolean }> = [
        { name: "key", required: true, hidden: false },
    ];

    public async run(): Promise<void> {
        const { args, paths } = await parseWithNetwork(this.parse(GetCommand));

        const envFile = `${paths.config}/.env`;

        if (!existsSync(envFile)) {
            abort(`No environment file found at ${envFile}.`);
        }

        const env = envfile.parseFileSync(envFile);

        if (!env[args.key]) {
            abort(`The "${args.key}" doesn't exist.`);
        }

        console.log(env[args.key]);
    }
}
