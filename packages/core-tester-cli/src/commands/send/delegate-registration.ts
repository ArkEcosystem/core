import { Address, client } from "@arkecosystem/crypto";
import pokemon from "pokemon";
import { satoshiFlag } from "../../flags";
import { BaseCommand } from "../command";
import { TransferCommand } from "./transfer";

export class DelegateRegistrationCommand extends BaseCommand {
    public static description: string = "send multiple transactions";

    public static flags = {
        ...BaseCommand.flagsSent,
        delegateFee: satoshiFlag({
            description: "delegate registration fee",
            default: 25,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.make(DelegateRegistrationCommand);

        // Prepare...
        const wallets = await TransferCommand.run(
            [`--amount=${flags.delegateFee}`, `--number=${flags.number}`].concat(this.castFlags(flags)),
        );

        // Sign...
        const transactions = this.signTransactions(flags, wallets);

        // Expect...
        await this.expectBalances(transactions, wallets);

        // Send...
        await this.broadcastTransfers(transactions);

        // Verify...
        await this.verifyTransactions(transactions, wallets);

        return wallets;
    }

    protected signTransactions(flags: Record<string, any>, wallets: Record<string, any>) {
        const transactions = [];

        for (const wallet of Object.values(wallets)) {
            transactions.push(
                this.signer.makeDelegate({
                    ...flags,
                    ...{
                        username: pokemon
                            .random()
                            .toLowerCase()
                            .replace(/ /g, "_"),
                        // @ts-ignore
                        passphrase: wallet.passphrase,
                    },
                }),
            );
        }

        return transactions;
    }

    private async expectBalances(transactions, wallets) {
        for (const transaction of transactions) {
            const recipientId = Address.fromPublicKey(transaction.senderPublicKey, this.network.version);

            const currentBalance = await this.getWalletBalance(recipientId);
            wallets[recipientId].expectedBalance = currentBalance.minus(transaction.fee);
        }
    }

    private async verifyTransactions(transactions, wallets) {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);

            if (wasCreated) {
                const recipientId = Address.fromPublicKey(transaction.senderPublicKey, this.network.version);

                await this.knockBalance(recipientId, wallets[recipientId].expectedBalance);
            }
        }
    }
}
