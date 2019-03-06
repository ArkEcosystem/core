import { configManager, crypto, NetworkName, Transaction } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { handleOutput } from "../../utils";
import { BaseCommand } from "../command";

export class VerifySecondSignatureCommand extends BaseCommand {
    public static description: string = "Verify a second signature of a transaction";

    public static flags = {
        ...BaseCommand.flagsDebug,
        data: flags.string({
            description: "the HEX blob to deserialize and verify",
            required: true,
        }),
        publicKey: flags.string({
            description: "the publicKey of the second signature in HEX",
            required: true,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(VerifySecondSignatureCommand);

        configManager.setFromPreset(flags.network as NetworkName);

        const { data } = Transaction.fromHex(flags.data);

        return handleOutput(flags, crypto.verifySecondSignature(data, flags.publicKey));
    }
}
