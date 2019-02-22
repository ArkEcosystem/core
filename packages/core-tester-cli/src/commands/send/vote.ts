import { Address } from "@arkecosystem/crypto";
import { satoshiFlag } from "../../flags";
import { logger } from "../../logger";
import { BaseCommand } from "../command";
import { TransferCommand } from "./transfer";

export class VoteCommand extends BaseCommand {
    public static description: string = "send multiple transactions";

    public static flags = {
        ...BaseCommand.flagsSend,
        voteFee: satoshiFlag({
            description: "vote fee",
            default: 1,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.make(VoteCommand);

        // Prepare...
        const wallets = await TransferCommand.run(
            [`--amount=${flags.voteFee}`, `--number=${flags.number}`].concat(this.castFlags(flags)),
        );

        // Sign...
        const transactions = await this.signTransactions(flags, wallets);

        // Expect...
        await this.expectBalances(transactions, wallets);

        // Send...
        await this.broadcastTransactions(transactions);

        // Verify...
        await this.verifyTransactions(transactions, wallets);

        return wallets;
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>) {
        const transactions = [];

        for (const [address, wallet] of Object.entries(wallets)) {
            const delegate = await this.getRandomDelegate();

            const transaction = this.signer.makeVote({
                ...flags,
                ...{
                    delegate,
                    passphrase: wallet.passphrase,
                },
            });

            wallets[address].vote = delegate;

            transactions.push(transaction);
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
                await this.knockVote(recipientId, wallets[recipientId].vote);
            }
        }
    }

    private async knockVote(address: string, expected: string): Promise<void> {
        const { vote: actual } = (await this.api.get(`wallets/${address}`)).data;

        if (actual === expected) {
            logger.info(`[W] ${address} (${actual})`);
        } else {
            logger.error(`[W] ${address} (${expected} / ${actual})`);
        }
    }

    private async getRandomDelegate() {
        const { data } = await this.api.get("delegates");

        return data[0].publicKey;
    }
}
