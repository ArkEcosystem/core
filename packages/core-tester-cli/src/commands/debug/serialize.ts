import { Blocks, Interfaces, Managers, Transactions, Types } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { handleOutput } from "../../utils";
import { BaseCommand } from "../command";

export class SerializeCommand extends BaseCommand {
    public static description: string = "Serialize the given JSON";

    public static flags = {
        ...BaseCommand.flagsDebug,
        data: flags.string({
            description: "the JSON to serialize",
            required: true,
        }),
        type: flags.string({
            description: "transaction or block",
            required: true,
        }),
        full: flags.boolean({
            description: "serialize a full block with transactions",
            required: false,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(SerializeCommand);

        Managers.configManager.setFromPreset(flags.network as Types.NetworkName);

        let serialized: Buffer;
        if (flags.type === "transaction") {
            serialized = Transactions.TransactionFactory.fromData(JSON.parse(flags.data)).serialized;
        } else {
            // @TODO: call applySchema in @arkecosystem/crypto before serialising
            const block: Interfaces.IBlockData = Blocks.Block.applySchema(JSON.parse(flags.data));

            serialized = Blocks.Block[flags.full ? "serializeWithTransactions" : "serialize"](block);
        }

        return handleOutput(flags, serialized.toString("hex"));
    }
}
