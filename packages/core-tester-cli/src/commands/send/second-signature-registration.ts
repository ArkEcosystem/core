import { Address, client } from "@arkecosystem/crypto";
import pokemon from "pokemon";
import { satoshiFlag } from "../../flags";
import { logger } from "../../logger";
import { BaseCommand } from "../command";
import { TransferCommand } from "./transfer";

export class SecondSignatureRegistrationCommand extends BaseCommand {
    public static description: string = "send multiple transactions";

    public static flags = {
        ...BaseCommand.flagsSend,
        signatureFee: satoshiFlag({
            description: "second signature fee",
            default: 5,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.make(SecondSignatureRegistrationCommand);

        // Prepare...
        const wallets = await TransferCommand.run(
            [`--amount=${flags.signatureFee}`, `--number=${flags.number}`].concat(this.castFlags(flags)),
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
            const transaction = this.signer.makeSecondSignature({
                ...flags,
                ...{
                    passphrase: wallet.passphrase,
                    secondPassphrase: wallet.passphrase,
                },
            });

            wallets[address].publicKey = transaction.senderPublicKey;
            wallets[address].secondPublicKey = transaction.asset.signature.publicKey;

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
                await this.knockSignature(recipientId, wallets[recipientId].secondPublicKey);
            }
        }
    }

    private async knockSignature(address: string, expected: string): Promise<void> {
        const { secondPublicKey: actual } = (await this.api.get(`wallets/${address}`)).data;

        if (actual === expected) {
            logger.info(`[W] ${address} (${actual})`);
        } else {
            logger.error(`[W] ${address} (${expected} / ${actual})`);
        }
    }
}
