import Command from "@oclif/command";
import { CLIError } from "@oclif/errors";
import { Paths } from "env-paths";

import { flagsNetwork } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { File, Git, NPM, Source } from "../../services/plugins/sources";
import { CommandFlags } from "../../types";

export class InstallCommand extends Command {
    public static description = "Installs a package and any packages that it depends on.";

    public static examples: string[] = [
        `Installs a package and any packages that it depends on.
    $ ark plugin:install my-package-name
    `,
    ];

    public static args = [
        {
            name: "package",
            required: true,
        },
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
    };

    public async run(): Promise<void> {
        const { args, paths } = await parseWithNetwork(this.parse(InstallCommand));

        try {
            await this.install(args, paths);
        } catch (error) {
            throw new CLIError(error.message);
        }

        throw new CLIError(`The given package [${args.pkg}] is neither a git nor a npm package.`);
    }

    private async install(args, paths: Paths): Promise<void> {
        for (const Instance of [File, Git, NPM]) {
            const source: Source = new Instance({ data: paths.data, temp: paths.temp });

            if (await source.exists(args.package)) {
                return source.install(args.package);
            }
        }
    }
}
