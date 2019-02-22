import { flags } from "@oclif/command";
import { SendCommand } from "../../shared/send";
import { WalletCommand } from "../make/wallets";

export class TransferCommand extends SendCommand {
    public static description: string = "send multiple transactions";

    public static flags = {
        ...SendCommand.flagsSend,
        recipient: flags.string({
            description: "recipient address",
        }),
        vendorField: flags.string({
            description: "vendor field to use",
        }),
    };

    protected getCommand(): any {
        return TransferCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        return WalletCommand.run([`--quantity=${flags.number}`].concat(this.castFlags(flags)));
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const transactions = [];

        for (const wallet of Object.keys(wallets)) {
            transactions.push(this.signer.makeTransfer({ ...flags, ...{ recipient: wallet } }));
        }

        return transactions;
    }

    protected async expectBalances(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const currentBalance = await this.getWalletBalance(transaction.recipientId);
            wallets[transaction.recipientId].expectedBalance = currentBalance.plus(transaction.amount);
        }
    }

    protected async verifyTransactions(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);

            if (wasCreated) {
                await this.knockBalance(transaction.recipientId, wallets[transaction.recipientId].expectedBalance);
            }
        }
    }
}
