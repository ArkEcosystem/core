import { configManager, models, NetworkName, Transaction } from "@arkecosystem/crypto";
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

        configManager.setFromPreset(flags.network as NetworkName);

        let output;
        if (flags.type === "transaction") {
            output = Transaction.fromHex(flags.data).data;
        } else {
            const block = new models.Block(flags.data);
            output = { data: block.data, transactions: block.transactions.map(tx => tx.data) };
        }

        return handleOutput(flags, JSON.stringify(output, null, 4));
    }
}
