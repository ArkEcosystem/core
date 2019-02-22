import { crypto } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import delay from "delay";
import { BaseCommand } from "../command";
import { WalletCommand } from "../make/wallets";

export class TransferCommand extends BaseCommand {
    public static description: string = "send multiple transactions";

    public static flags = {
        ...BaseCommand.flagsSent,
        recipient: flags.string({
            description: "recipient address",
        }),
        vendorField: flags.string({
            description: "vendor field to use",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.make(TransferCommand);

        // Prepare...
        const wallets = await WalletCommand.run([`--quantity=${flags.number}`].concat(this.castFlags(flags)));
        const transactions = this.signTransfers(flags, wallets);

        // Expect...
        await this.expectBalances(transactions, wallets);

        // Send...
        await this.broadcastTransfers(transactions);

        // Verify...
        await this.verifyTransfers(transactions, wallets);
    }
}
