import { client } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import pluralize from "pluralize";
import { logger } from "../utils";
import { BaseCommand } from "./command";
import { TransferCommand } from "./transfer";

export class SecondSignatureCommand extends BaseCommand {
    public static description: string = "create wallets with second signature";

    public static flags = {
        ...BaseCommand.flags,
        signatureFee: flags.integer({
            description: "second signature fee",
            default: 5,
        }),
    };

    /**
     * Run second-signature command.
     * @return {void}
     */
    public async run(): Promise<void> {
        // tslint:disable-next-line:no-shadowed-variable
        const { flags } = this.parse(SecondSignatureCommand);

        this.options = flags;

        const wallets = this.generateWallets();

        for (const wallet of wallets) {
            await TransferCommand.run([
                "--recipient",
                wallet.address,
                "--amount",
                this.options.amount || 5,
                "--skip-testing",
            ]);
        }

        logger.info(`Sending ${this.options.number} second signature ${pluralize("transaction", this.options.number)}`);

        const transactions = [];
        wallets.forEach((wallet, i) => {
            wallet.secondPassphrase = this.config.secondPassphrase || wallet.passphrase;
            const transaction = client
                .getBuilder()
                .secondSignature()
                .fee(this.parseFee(this.options.signatureFee))
                .signatureAsset(wallet.secondPassphrase)
                .network(this.config.network.version)
                .sign(wallet.passphrase)
                .build();

            wallet.publicKey = transaction.senderPublicKey;
            wallet.secondPublicKey = transaction.asset.signature.publicKey;
            transactions.push(transaction);

            logger.info(`${i} ==> ${transaction.id}, ${wallet.address} (fee: ${this.arktoshiToArk(transaction.fee)})`);
        });

        if (this.options.copy) {
            this.copyToClipboard(transactions);
            return;
        }

        try {
            await this.sendTransactions(transactions, "second-signature", !this.options.skipValidation);

            if (this.options.skipValidation) {
                return;
            }

            for (const walletObject of wallets) {
                const wallet = await this.getWallet(walletObject.address);

                if (
                    wallet.secondPublicKey !== walletObject.secondPublicKey ||
                    wallet.publicKey !== walletObject.publicKey
                ) {
                    logger.error(`Invalid second signature for ${walletObject.address}.`);
                }
            }
        } catch (error) {
            logger.error(
                `There was a problem sending transactions: ${error.response ? error.response.data.message : error}`,
            );
        }
    }
}
