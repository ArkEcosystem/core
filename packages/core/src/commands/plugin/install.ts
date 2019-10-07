import Command from "@oclif/command";
import { CLIError } from "@oclif/errors";

import { flagsNetwork } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { Blockchain } from "../../services/plugins/sources/blockchain";
import { Source } from "../../services/plugins/sources/contracts";
import { Git } from "../../services/plugins/sources/git";
import { NPM } from "../../services/plugins/sources/npm";
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
            const git: Source = new Git(paths);

            if (await git.exists(args.package)) {
                return git.install(args.package);
            }

            const npm: Source = new NPM(paths);

            if (await npm.exists(args.package)) {
                return npm.install(args.package);
            }

            const blockchain: Source = new Blockchain(paths);

            if (await blockchain.exists(args.package)) {
                return blockchain.install(args.package);
            }
        } catch (error) {
            throw new CLIError(error.message);
        }

        throw new CLIError(`The given package [${args.pkg}] is neither a git nor a npm package.`);
    }
}
