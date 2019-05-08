import { flags } from "@oclif/command";
import { hasSomeProperty } from "@arkecosystem/core-utils";
import { existsSync } from "fs-extra";
import { CommandFlags, EnvironmentVars } from "../../types";
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

    private static readonly validFlags: string[] = ["host", "username", "database", "password"];

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
        const { flags, paths } = await this.parseWithNetwork(DatabaseCommand);

        if (!this.hasValidFlag(flags)) {
            this.error("Please specify at least one configuration flag.");
        }

        const envFile = `${paths.config}/.env`;

        if (!existsSync(envFile)) {
            this.error(`No environment file found at ${envFile}`);
        }

        const variables: EnvironmentVars = {};

        for (const flag in DatabaseCommand.validFlags) {
            if (flags[flag] !== undefined) {
                variables[`CORE_DB_${flag.toUpperCase()}`] = flags[flag];
            }
        }

        updateEnvironmentVariables(envFile, variables);
    }

    private hasValidFlag(flags: CommandFlags): boolean {
        return hasSomeProperty(flags, DatabaseCommand.validFlags);
    }
}
