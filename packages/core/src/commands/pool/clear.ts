import { readdirSync } from "fs";
import { removeSync } from "fs-extra";
import { confirm } from "../../helpers/prompts";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class ClearCommand extends BaseCommand {
    public static description: string = "Clear the transaction pool";

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
    };

    public async run(): Promise<void> {
        const { flags, paths } = await this.parseWithNetwork(ClearCommand);

        this.abortRunningProcess(`${flags.token}-core`);
        this.abortRunningProcess(`${flags.token}-forger`);
        this.abortRunningProcess(`${flags.token}-relay`);

        if (flags.force) {
            return this.removeFiles(paths.data);
        }

        try {
            await confirm("Are you sure you want to clear the transaction pool?", async () => {
                this.removeFiles(paths.data);
            });
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
