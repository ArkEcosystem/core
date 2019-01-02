import Table from "cli-table3";
import envfile from "envfile";
import expandHomeDir from "expand-home-dir";
import { existsSync } from "fs-extra";
import { BaseCommand as Command } from "../command";

export class EnvList extends Command {
    public static description = "get a value from the environment";

    public static examples = [
        `List all environment variables
$ ark env:list
`,
    ];

    public static flags = {
        ...Command.flagsConfig,
    };

    public async run() {
        const { flags } = this.parse(EnvList);

        const envFile = `${expandHomeDir(flags.data)}/.env`;

        if (!existsSync(envFile)) {
            throw new Error(`No environment file found at ${envFile}`);
        }

        const env = envfile.parseFileSync(envFile);

        const table = new Table({
            head: ["Key", "Value"],
        });

        for (const [key, value] of Object.entries(env)) {
            // @ts-ignore
            table.push([key, value]);
        }

        console.log(table.toString());
    }
}
