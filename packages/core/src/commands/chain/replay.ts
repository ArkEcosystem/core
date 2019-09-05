import { app, Container, Contracts } from "@arkecosystem/core-kernel";
import Command, { flags } from "@oclif/command";

import { abort } from "../../common/cli";
import { flagsNetwork } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { setUpLite } from "../../common/replay";
import { CommandFlags } from "../../types";

export class ReplayCommand extends Command {
    public static description = "replay the blockchain from the local database";

    public static flags: CommandFlags = {
        ...flagsNetwork,
        targetHeight: flags.integer({
            description: "the target height to replay to. If not set, defaults to last block in database.",
            default: -1,
        }),
        suffix: flags.string({
            hidden: true,
            default: "replay",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await parseWithNetwork(this.parse(ReplayCommand));

        await setUpLite(flags);

        if (!app.isBound(Container.Identifiers.BlockchainService)) {
            abort("The @arkecosystem/core-blockchain plugin is not installed.");
        }

        await app
            .get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService)
            .replay(flags.targetHeight);
    }
}
