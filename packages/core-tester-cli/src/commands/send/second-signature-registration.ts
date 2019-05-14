import { Identities } from "@arkecosystem/crypto";
import { satoshiFlag } from "../../flags";
import { logger } from "../../logger";
import { SendCommand } from "../../shared/send";
import { TransferCommand } from "./transfer";

export class SecondSignatureRegistrationCommand extends SendCommand {
    public static description: string = "create wallets with second signature";

    public static flags = {
        ...SendCommand.flagsSend,
        signatureFee: satoshiFlag({
            description: "second signature fee",
            default: 5,
        }),
    };

    protected getCommand(): any {
        return SecondSignatureRegistrationCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        return TransferCommand.run(
            [`--amount=${flags.signatureFee}`, `--number=${flags.number}`, "--skipProbing"].concat(
                this.castFlags(flags),
            ),
        );
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
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
