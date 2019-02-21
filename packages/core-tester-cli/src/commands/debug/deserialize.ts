import { models } from "@arkecosystem/crypto";
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
        const { flags } = await this.make(DeserializeCommand);

        const deserialized =
            flags.type === "transaction" ? new models.Transaction(flags.data) : new models.Block(flags.data);

        return handleOutput(flags, JSON.stringify(deserialized, null, 4));
    }
}
