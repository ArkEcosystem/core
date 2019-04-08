import { blocks, configManager, NetworkName, Transaction } from "@arkecosystem/crypto";
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

        configManager.setFromPreset(flags.network as NetworkName);

        const serialized =
            flags.type === "transaction"
                ? Transaction.fromData(JSON.parse(flags.data)).serialized
                : blocks.Block[flags.full ? "serializeFull" : "serialize"](JSON.parse(flags.data));

        return handleOutput(flags, serialized.toString("hex"));
    }
}
