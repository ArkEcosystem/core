import Command from "@oclif/command";
import { CLIError } from "@oclif/errors";

import { flagsNetwork } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { Blockchain, File, Git, NPM, Source } from "../../services/plugins/sources";
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
            // Local File
            const file: Source = new File(paths);

            if (await file.exists(args.package)) {
                return file.install(args.package);
            }

            // Git Repository
            const git: Source = new Git(paths);

            if (await git.exists(args.package)) {
                return git.install(args.package);
            }

            // NPM Package
            const npm: Source = new NPM(paths);

            if (await npm.exists(args.package)) {
                return npm.install(args.package);
            }

            // Blockchain Registration
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
