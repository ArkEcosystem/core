import { client } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import pluralize from "pluralize";
import { customFlags } from "../flags";
import { logger, parseFee, satoshiToArk } from "../utils";
import { BaseCommand } from "./command";
import { TransferCommand } from "./transfer";

export class SecondSignatureCommand extends BaseCommand {
    public static description: string = "create wallets with second signature";

    public static flags = {
        ...BaseCommand.flags,
        signatureFee: customFlags.number({
            description: "second signature fee",
            default: 5,
        }),
    };

    /**
     * Run second-signature command.
     * @return {void}
     */
    public async run(): Promise<void> {
        // tslint:disable-next-line: no-shadowed-variable
        const { flags } = await this.initialize(SecondSignatureCommand);

        const wallets = this.generateWallets();

        for (const wallet of wallets) {
            await TransferCommand.run(
                ["--recipient", wallet.address, "--amount", String(this.options.amount || 5), "--skipTesting"].concat(
                    this.castFlags(flags),
                ),
            );
        }

        logger.info(`Sending ${this.options.number} second signature ${pluralize("transaction", this.options.number)}`);

        const transactions = [];
        wallets.forEach((wallet, i) => {
            wallet.secondPassphrase = this.config.secondPassphrase || wallet.passphrase;
            const transaction = client
                .getBuilder()
                .secondSignature()
                .fee(parseFee(this.options.signatureFee))
                .signatureAsset(wallet.secondPassphrase)
                .network(this.config.network.version)
                .sign(wallet.passphrase)
                .build();

            wallet.publicKey = transaction.data.senderPublicKey;
            wallet.secondPublicKey = transaction.data.asset.signature.publicKey;
            transactions.push(transaction);

            logger.info(`${i} ==> ${transaction.id}, ${wallet.address} (fee: ${satoshiToArk(transaction.data.fee)})`);
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
