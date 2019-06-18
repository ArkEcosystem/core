import { Blocks, Managers, Transactions, Types } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { handleOutput } from "../../utils";
import { BaseCommand } from "../command";

export class VerifyCommand extends BaseCommand {
    public static description: string = "Verify the given HEX";

    public static flags = {
        ...BaseCommand.flagsDebug,
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
        const { flags } = this.parse(VerifyCommand);

        Managers.configManager.setFromPreset(flags.network as Types.NetworkName);

        let output = false;
        if (flags.type === "transaction") {
            output = Transactions.TransactionFactory.fromHex(flags.data).verified;
        } else {
            output = Blocks.BlockFactory.fromData(Blocks.Block.deserialize(flags.data)).verification.verified;
        }

        return handleOutput(flags, output);
    }
}
