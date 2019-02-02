import { models } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { handleOutput } from "../utils";
import { BaseCommand } from "./command";

export class VerifyCommand extends BaseCommand {
    public static description: string = "Verify the given HEX";

    public static flags = {
        ...BaseCommand.flags,
        data: flags.string({
            description: "the HEX blob to deserialize and verify",
            required: true,
        }),
        type: flags.string({
            description: "transaction or block",
            required: true,
        }),
    };

    public async run(): Promise<void> {
        // tslint:disable-next-line:no-shadowed-variable
        const { flags } = this.parse(VerifyCommand);

        const deserialized =
            flags.type === "transaction"
                ? new models.Transaction(flags.data)
                : new models.Block(models.Block.deserialize(flags.data));

        const output =
            deserialized instanceof models.Transaction ? deserialized.verify() : deserialized.verification.verified;

        return handleOutput(flags, output);
    }
}
