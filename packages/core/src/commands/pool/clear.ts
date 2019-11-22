import { readdirSync } from "fs";
import { removeSync } from "fs-extra";
import { CommandFlags } from "../../types";
import { abortRunningProcess } from "../../common/process";
import { parseWithNetwork } from "../../common/parser";
import Command from "@oclif/command";
import { flagsNetwork } from "../../common/flags";
import { confirm } from "cli-ux/lib/prompt";

export class ClearCommand extends Command {
    public static description: string = "Clear the transaction pool";

    public static flags: CommandFlags = {
        ...flagsNetwork,
    };

    public async run(): Promise<void> {
        const { flags, paths } = await parseWithNetwork(this.parse(ClearCommand));

        abortRunningProcess(`${flags.token}-core`);
        abortRunningProcess(`${flags.token}-forger`);
        abortRunningProcess(`${flags.token}-relay`);

        if (flags.force) {
            return this.removeFiles(paths.data);
        }

        try {
            const confirmed: boolean = await confirm("Are you sure you want to clear the transaction pool?");
            if (confirmed) {
                this.removeFiles(paths.data);
            }

        } catch (err) {
            this.error(err.message);
        }
    }

    private removeFiles(dataPath: string) {
        const files: string[] = readdirSync(dataPath).filter((file: string) => file.includes("transaction-pool"));

        for (const file of files) {
            removeSync(`${dataPath}/${file}`);
        }
    }
}
