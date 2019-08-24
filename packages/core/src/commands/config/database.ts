import { hasSomeProperty } from "@arkecosystem/core-utils";
import { flags } from "@oclif/command";
import prompts from "prompts";
import { CommandFlags, EnvironmentVars } from "../../types";
import { updateEnvironmentVariables } from "../../utils";
import { BaseCommand } from "../command";

export class DatabaseCommand extends BaseCommand {
    public static description = "Update the Database configuration";

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
        database: flags.string({
            description: "the name of the database that should be used",
        }),
        username: flags.string({
            description: "the name of the database user",
        }),
        password: flags.string({
            description: "the password for the database that should be used",
        }),
    };

    private static readonly validFlags: string[] = ["host", "port", "database", "username", "password"];

    public async run(): Promise<void> {
        const { flags, paths } = await this.parseWithNetwork(DatabaseCommand);

        const envFile = `${paths.config}/.env`;

        if (this.hasValidFlag(flags)) {
            updateEnvironmentVariables(envFile, this.conform(flags));

            return;
        }

        // Interactive CLI
        const response = await prompts([
            {
                type: "text",
                name: "host",
                message: "What host do you want to use?",
                initial: "localhost",
            },
            {
                type: "text",
                name: "port",
                message: "What port do you want to use?",
                initial: 5432,
                validate: value => (value < 1 || value > 65535 ? `The port must be in the range of 1-65535.` : true),
            },
            {
                type: "text",
                name: "database",
                message: "What database do you want to use?",
                initial: `${flags.token}_${flags.network}`,
            },
            {
                type: "text",
                name: "username",
                message: "What username do you want to use?",
                initial: flags.token,
            },
            {
                type: "password",
                name: "password",
                message: "What password do you want to use?",
                initial: "password",
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
            },
        ]);

        if (response.confirm) {
            updateEnvironmentVariables(envFile, this.conform(response));
        }
    }

    private hasValidFlag(flags: CommandFlags): boolean {
        return hasSomeProperty(flags, DatabaseCommand.validFlags);
    }

    private conform(flags: CommandFlags): EnvironmentVars {
        const variables: EnvironmentVars = {};

        for (const flag of DatabaseCommand.validFlags) {
            if (flags[flag] !== undefined) {
                variables[`CORE_DB_${flag.toUpperCase()}`] = flags[flag];
            }
        }

        return variables;
    }
}
