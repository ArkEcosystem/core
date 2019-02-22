import { Address } from "@arkecosystem/crypto";
import pokemon from "pokemon";
import { satoshiFlag } from "../../flags";
import { logger } from "../../logger";
import { BaseCommand } from "../command";
import { TransferCommand } from "./transfer";

export class DelegateRegistrationCommand extends BaseCommand {
    public static description: string = "send multiple transactions";

    public static flags = {
        ...BaseCommand.flagsSend,
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
        await this.broadcastTransactions(transactions);

        // Verify...
        await this.verifyTransactions(transactions, wallets);

        return wallets;
    }

    protected signTransactions(flags: Record<string, any>, wallets: Record<string, any>) {
        const transactions = [];

        for (const [address, wallet] of Object.entries(wallets)) {
            wallets[address].username = pokemon
                .random()
                .toLowerCase()
                .replace(/ /g, "_");

            transactions.push(
                this.signer.makeDelegate({
                    ...flags,
                    ...{
                        username: wallets[address].username,
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
                await this.knockUsername(recipientId, wallets[recipientId].username);
            }
        }
    }

    private async knockUsername(address: string, expected: string): Promise<void> {
        const { username: actual } = (await this.api.get(`wallets/${address}`)).data;

        if (actual === expected) {
            logger.info(`[W] ${address} (${actual})`);
        } else {
            logger.error(`[W] ${address} (${expected} / ${actual})`);
        }
    }
}
