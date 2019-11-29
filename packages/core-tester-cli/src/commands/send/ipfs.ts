import { Identities } from "@arkecosystem/crypto";
import { satoshiFlag } from "../../flags";
import { SendCommand } from "../../shared/send";
import { TransferCommand } from "./transfer";

export class IpfsCommand extends SendCommand {
    public static description: string = "create multiple ipfs transactions";

    public static flags = {
        ...SendCommand.flagsSend,
        ipfsFee: satoshiFlag({
            description: "IPFS fee",
            default: 5,
        }),
    };

    protected getCommand(): any {
        return IpfsCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        return TransferCommand.run(
            [`--amount=${flags.ipfsFee}`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)),
        );
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const transactions = [];

        for (const wallet of Object.values(wallets)) {
            const ipfs = `Qm${wallet.address.repeat(2).slice(0, 44)}`;
            // we use stripped address as ipfs hash with Qm indicating SHA-256

            const transaction = this.signer.makeIpfs({
                ...flags,
                ...{
                    ipfs,
                    ipfsFee: flags.ipfsFee,
                    passphrase: wallet.passphrase,
                },
            });

            transactions.push(transaction);
        }

        return transactions;
    }

    protected async expectBalances(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const recipientId = Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);

            const currentBalance = await this.getWalletBalance(recipientId);
            wallets[recipientId].expectedBalance = currentBalance.minus(transaction.fee);
        }
    }

    protected async verifyTransactions(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);

            if (wasCreated) {
                const recipientId = Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);

                await this.knockBalance(recipientId, wallets[recipientId].expectedBalance);
            }
        }
    }
}
