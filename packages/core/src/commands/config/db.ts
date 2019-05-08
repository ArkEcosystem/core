import { existsSync } from "fs-extra";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";
import { updateEnvironmentVariables } from "../../utils";

export class DatabaseCommand extends BaseCommand {
    public static description: string = "Update the Database configuration";

    public static examples: string[] = [
        `Set the database host
$ ark config:db --host=localhost
`,
        `Set the name of the database user
$ ark config:db --username=ark
`,
        `Set the database name
$ ark config:db --database=ark_mainnet
`,
        `Set the database password
$ ark config:db --password=password
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
        host: flags.string({
            description: "the host of the database"
        }),
        username: flags.string({
            description: "the name of the database user",
        }),
        name: flags.string({
            description: "the name of the database that should be used",
        }),
        password: flags.string({
            description: "the password for the database that should be used",
        }),
    };

    public async run(): Promise<void> {
        const { args, paths } = await this.parseWithNetwork(DatabaseCommand);

        const envFile = `${paths.config}/.env`;

        if (!existsSync(envFile)) {
            this.error(`No environment file found at ${envFile}`);
        }

        const variables: Record<string, any> = {};

        for (const arg in ["host", "username", "database", "password"]) {
            if (args[arg] !== undefined) {
                variables[`CORE_DB_${arg.toUppercase()}`] = args[arg];
            }
        }

        updateEnvironmentVariables(envFile, variables);
    }
}
