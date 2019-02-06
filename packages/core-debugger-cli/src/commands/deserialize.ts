import { models } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { handleOutput } from "../utils";
import { BaseCommand } from "./command";

export class DeserializeCommand extends BaseCommand {
    public static description: string = "Deserialize the given HEX";

    public static flags = {
        ...BaseCommand.flags,
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
        // tslint:disable-next-line:no-shadowed-variable
        const { flags } = this.parse(DeserializeCommand);

        const { data } =
            flags.type === "transaction"
                ? models.AbstractTransaction.fromHex(flags.data)
                : new models.Block(flags.data);

        return handleOutput(flags, JSON.stringify(data, null, 4));
    }
}
