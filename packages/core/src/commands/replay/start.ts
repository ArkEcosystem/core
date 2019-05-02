import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";
import { setUpLite } from "../../helpers/replay";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class StartCommand extends BaseCommand {
    public static description: string = "replay the blockchain from the local database";

    public static flags: CommandFlags = {
        ...BaseCommand.flagsReplay,
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(StartCommand);

        process.env.CORE_SKIP_BLOCKCHAIN = "true";

        await setUpLite(flags);

        if (!app.has("blockchain")) {
            this.error("The @arkecosystem/core-blockchain plugin is not installed.");
        }

        const startHeight: number = flags.from;
        const endHeight: number = flags.to;

        await app.resolvePlugin<Blockchain.IBlockchain>("blockchain").replay(startHeight, endHeight);
    }
}
