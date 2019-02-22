import { crypto } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import delay from "delay";
import { BaseCommand } from "../command";
import { WalletCommand } from "../make/wallets";

export class TransferCommand extends BaseCommand {
    public static description: string = "send multiple transactions";

    public static flags = {
        ...BaseCommand.flagsSend,
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

        // Sign...
        const transactions = this.signTransactions(flags, wallets);

        // Expect...
        await this.expectBalances(transactions, wallets);

        // Send...
        await this.broadcastTransactions(transactions);

        // Verify...
        await this.verifyTransactions(transactions, wallets);

        return wallets;
    }

    protected signTransactions(flags: Record<string, any>, wallets: Record<string, any>) {
        const transactions = [];

        for (const wallet of Object.keys(wallets)) {
            transactions.push(this.signer.makeTransfer({ ...flags, ...{ recipient: wallet } }));
        }

        return transactions;
    }

    private async expectBalances(transactions, wallets) {
        for (const transaction of transactions) {
            const currentBalance = await this.getWalletBalance(transaction.recipientId);
            wallets[transaction.recipientId].expectedBalance = currentBalance.plus(transaction.amount);
        }
    }

    private async verifyTransactions(transactions, wallets) {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);

            if (wasCreated) {
                await this.knockBalance(transaction.recipientId, wallets[transaction.recipientId].expectedBalance);
            }
        }
    }
}
