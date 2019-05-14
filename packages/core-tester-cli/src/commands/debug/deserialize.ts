import { Blocks, Managers, Transactions, Types } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { handleOutput } from "../../utils";
import { BaseCommand } from "../command";

export class DeserializeCommand extends BaseCommand {
    public static description: string = "Deserialize the given HEX";

    public static flags = {
        ...BaseCommand.flagsDebug,
        data: flags.string({
            description: "the HEX blob to deserialize",
            required: true,
            default: "transaction",
        }),
        type: flags.string({
            description: "transaction or block",
            required: true,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(DeserializeCommand);

        Managers.configManager.setFromPreset(flags.network as Types.NetworkName);

        let output;
        if (flags.type === "transaction") {
            output = Transactions.TransactionFactory.fromHex(flags.data).data;
        } else {
            const block = Blocks.BlockFactory.fromHex(flags.data);
            output = { data: block.data, transactions: block.transactions.map(tx => tx.data) };
        }

        return handleOutput(flags, JSON.stringify(output, undefined, 4));
    }
}
