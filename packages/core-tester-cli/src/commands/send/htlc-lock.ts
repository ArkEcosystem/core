import { Identities } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { satoshiFlag } from "../../flags";
import { htlcSecretHashHex } from "../../shared/htlc-secret";
import { SendCommand } from "../../shared/send";
import { TransferCommand } from "./transfer";

export class HtlcLockCommand extends SendCommand {
    public static description: string = "create multiple htlc lock transactions";

    public static flags = {
        ...SendCommand.flagsSend,
        htlcLockFee: satoshiFlag({
            description: "HTLC Lock fee",
            default: 0.1,
        }),
        expiration: flags.integer({
            description: "expiration in seconds relative to now",
            default: 999,
        }),
    };

    protected getCommand(): any {
        return HtlcLockCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        return TransferCommand.run(
            [`--amount=${flags.htlcLockFee + flags.amount}`, `--number=${flags.number}`, "--skipProbing"].concat(
                this.castFlags(flags),
            ),
        );
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const transactions = [];

        for (const wallet of Object.values(wallets)) {
            const lockAsset = {
                secretHash: htlcSecretHashHex,
                expiration: { type: 1, value: Math.floor((Date.now() + flags.expiration * 1000) / 1000) },
            };

            const transaction = this.signer.makeHtlcLock({
                ...flags,
                ...{
                    lock: lockAsset,
                    amount: flags.amount,
                    recipient: flags.recipient || wallet.address,
                    htlcLockFee: flags.htlcLockFee,
                    passphrase: wallet.passphrase,
                },
            });

            wallet.lockTransaction = transaction;
            // this is used by claim and refund commands

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
