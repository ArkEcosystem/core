import Command from "@oclif/command";
import { CLIError } from "@oclif/errors";
import { existsSync } from "fs";

import { parseWithNetwork } from "../../common/parser";
import { Git, NPM } from "../../services/plugins/sources";

export class UpdateCommand extends Command {
    public static description = "Updates a package and any packages that it depends on.";

    public static examples: string[] = [
        `Updates a package and any packages that it depends on.
    $ ark plugin:update my-package-name
    `,
    ];

    public static args = [
        {
            name: "package",
            required: true,
        },
    ];

    public async run(): Promise<void> {
        const { args, paths } = await parseWithNetwork(this.parse(UpdateCommand));

        const directory: string = `${paths.data}/plugins/${args.package}`;

        if (!existsSync(directory)) {
            throw new CLIError(`The package [${args.package}] does not exist.`);
        }

        if (existsSync(`${directory}/.git`)) {
            return new Git(paths).update(args.package);
        }

        return new NPM(paths).update(args.package);
    }
}
