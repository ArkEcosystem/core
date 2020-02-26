import { app } from "@arkecosystem/core-container";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { flags } from "@oclif/command";
import { setUpLite } from "../../helpers/snapshot";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class RollbackCommand extends BaseCommand {
    public static description: string = "rollback chain to specified height";

    public static flags: CommandFlags = {
        ...BaseCommand.flagsSnapshot,
        height: flags.integer({
            description: "the height after the roll back",
        }),
        number: flags.integer({
            description: "the number of blocks to roll back",
        }),
        export: flags.boolean({
            description: "export the rolled back transactions",
            default: true,
            allowNo: true,
        })
    };

    public async run(): Promise<void> {
        const { flags, paths } = await this.parseWithNetwork(RollbackCommand);

        this.abortRunningProcess(`${flags.token}-core`);
        this.abortRunningProcess(`${flags.token}-forger`);
        this.abortRunningProcess(`${flags.token}-relay`);

        await setUpLite(flags, paths);

        if (!app.has("snapshots")) {
            this.error("The @arkecosystem/core-snapshots plugin is not installed.");
        }

        if (flags.height) {
            await app.resolvePlugin<SnapshotManager>("snapshots").rollbackByHeight(flags.height, flags.export);
        } else if (flags.number) {
            await app.resolvePlugin<SnapshotManager>("snapshots").rollbackByNumber(flags.number, flags.export);
        } else {
            this.error("Please specify either a height or number of blocks to roll back.");
        }
    }
}
