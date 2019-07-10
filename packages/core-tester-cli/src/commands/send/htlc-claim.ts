import { Identities } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { satoshiFlag } from "../../flags";
import { SendCommand } from "../../shared/send";
import { TransferCommand } from "./transfer";

export class HtlcClaimCommand extends SendCommand {
    public static description: string = "create multiple htlc claim transactions";

    public static flags = {
        ...SendCommand.flagsSend,
        htlcClaimFee: satoshiFlag({
            description: "HTLC Claim fee",
            default: 0.1,
        }),
        lockTransactionId: flags.string({
            description: "lock transaction id",
            default: "0b127468138499138c9498d356975c2aac194f5a6963a59d025d1e46fc29241a",
        }),
    };

    protected getCommand(): any {
        return HtlcClaimCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        return TransferCommand.run(
            [`--amount=${flags.htlcClaimFee}`, `--number=${flags.number}`, "--skipProbing"].concat(
                this.castFlags(flags),
            ),
        );
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const transactions = [];

        for (const wallet of Object.values(wallets)) {
            const unlockSecret = wallet.address.slice(0, 32);
            // we use the 32 first chars of wallet address as secret

            const claimAsset = {
                unlockSecret,
                lockTransactionId: flags.lockTransactionId,
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
            wallets[senderId].expectedBalance = currentBalance.minus(transaction.fee).minus(transaction.amount);
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
