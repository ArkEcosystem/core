import { Identities } from "@arkecosystem/crypto";
import { satoshiFlag } from "../../flags";
import { htlcSecretHex } from "../../shared/htlc-secret";
import { SendCommand } from "../../shared/send";
import { HtlcLockCommand } from "./htlc-lock";

export class HtlcClaimCommand extends SendCommand {
    public static description: string = "create multiple htlc claim transactions";

    public static flags = {
        ...SendCommand.flagsSend,
        htlcClaimFee: satoshiFlag({
            description: "HTLC Claim fee",
            default: 0.1,
        }),
    };

    protected getCommand(): any {
        return HtlcClaimCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        return HtlcLockCommand.run(
            [`--amount=${flags.amount}`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)),
        );
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const transactions = [];

        for (const wallet of Object.values(wallets)) {
            const claimAsset = {
                unlockSecret: htlcSecretHex,
                lockTransactionId: wallet.lockTransaction.id,
            };

            const transaction = this.signer.makeHtlcClaim({
                ...flags,
                ...{
                    claim: claimAsset,
                    htlcClaimFee: flags.htlcClaimFee,
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
