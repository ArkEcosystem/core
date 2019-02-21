import { models } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { handleOutput } from "../../utils";
import { BaseCommand } from "../command";

export class SerializeCommand extends BaseCommand {
    public static description: string = "Serialize the given JSON";

    public static flags = {
        ...BaseCommand.flagsDebug,
        data: flags.string({
            description: "the HEX blob to serialize",
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
        const { flags } = await this.make(SerializeCommand);

        const serialized: any =
            flags.type === "transaction"
                ? models.Transaction.serialize(JSON.parse(flags.data))
                : models.Block[flags.full ? "serializeFull" : "serialize"](JSON.parse(flags.data));

        return handleOutput(flags, serialized.toString("hex"));
    }
}
