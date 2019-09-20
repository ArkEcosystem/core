import { Identities } from "@arkecosystem/crypto";
import { satoshiFlag } from "../../flags";
import { SendCommand } from "../../shared/send";
import { HtlcLockCommand } from "./htlc-lock";

export class HtlcRefundCommand extends SendCommand {
    public static description: string = "create multiple htlc refund transactions";

    public static flags = {
        ...SendCommand.flagsSend,
        htlcRefundFee: satoshiFlag({
            description: "HTLC Refund fee",
            default: 0.1,
        }),
    };

    protected getCommand(): any {
        return HtlcRefundCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        return HtlcLockCommand.run(
            [`--amount=${flags.amount}`, `--expiration=1`, `--number=${flags.number}`, "--skipProbing"].concat(
                this.castFlags(flags),
            ),
        );
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const transactions = [];

        for (const wallet of Object.values(wallets)) {
            const refundAsset = {
                lockTransactionId: wallet.lockTransaction.id,
            };

            const transaction = this.signer.makeHtlcRefund({
                ...flags,
                ...{
                    refund: refundAsset,
                    htlcRefundFee: flags.htlcRefundFee,
                    passphrase: wallet.passphrase,
                },
            });

            transactions.push(transaction);
        }

        return transactions;
    }

    protected async expectBalances(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const senderId = Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);

            const currentBalance = await this.getWalletBalance(senderId);
            wallets[senderId].expectedBalance = currentBalance
                .minus(transaction.fee)
                .plus(wallets[senderId].lockTransaction.amount);
        }
    }

    protected async verifyTransactions(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);

            if (wasCreated) {
                const senderId = Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);

                await this.knockBalance(senderId, wallets[senderId].expectedBalance);
            }
        }
    }
}
