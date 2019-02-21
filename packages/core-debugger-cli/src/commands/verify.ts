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

        let output = false;
        if (flags.type === "transaction") {
            output = models.Transaction.fromHex(flags.data).verified;
        } else {
            output = new models.Block(models.Block.deserialize(flags.data)).verification.verified;
        }

        return handleOutput(flags, output);
    }
}
