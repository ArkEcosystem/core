import { hasSomeProperty } from "@arkecosystem/core-utils";
import { flags } from "@oclif/command";
import { existsSync } from "fs-extra";
import { CommandFlags, EnvironmentVars } from "../../types";
import { updateEnvironmentVariables } from "../../utils";
import { BaseCommand } from "../command";

export class DatabaseCommand extends BaseCommand {
    public static description: string = "Update the Database configuration";

    public static examples: string[] = [
        `Set the database host
$ ark config:database --host=localhost
`,
        `Set the database port
$ ark config:database --port=5432
`,
        `Set the name of the database user
$ ark config:database --username=ark
`,
        `Set the database name
$ ark config:database --database=ark_mainnet
`,
        `Set the database password
$ ark config:database --password=password
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
        host: flags.string({
            description: "the host of the database",
        }),
        port: flags.integer({
            description: "the port of the database",
        }),
        username: flags.string({
            description: "the name of the database user",
        }),
        database: flags.string({
            description: "the name of the database that should be used",
        }),
        password: flags.string({
            description: "the password for the database that should be used",
        }),
    };

    private static readonly validFlags: string[] = ["host", "port", "username", "database", "password"];

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

        for (const flag of DatabaseCommand.validFlags) {
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
