import Command from "@oclif/command";
import { CLIError } from "@oclif/errors";
import { existsSync } from "fs";
import { removeSync } from "fs-extra";

import { parseWithNetwork } from "../../common/parser";

export class RemoveCommand extends Command {
    public static description = "Removes a package and any packages that it depends on.";

    public static examples: string[] = [
        `Removes a package and any packages that it depends on.
    $ ark plugin:remove my-package-name
    `,
    ];

    public static args = [
        {
            name: "package",
            required: true,
        },
    ];

    public async run(): Promise<void> {
        const { args, paths } = await parseWithNetwork(this.parse(RemoveCommand));

        const directory: string = `${paths.data}/plugins/${args.package}`;

        if (!existsSync(directory)) {
            throw new CLIError(`The package [${args.package}] does not exist.`);
        }

        removeSync(directory);
    }
}
