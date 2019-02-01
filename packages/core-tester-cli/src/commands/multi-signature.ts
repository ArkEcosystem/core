import { client } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import take from "lodash/take";
import pluralize from "pluralize";
import { logger } from "../utils";
import { BaseCommand } from "./command";
import { TransferCommand } from "./transfer";

export class MultiSignatureCommand extends BaseCommand {
    public static description: string = "create multiple multisig wallets";

    public static flags = {
        ...BaseCommand.flags,
        multisigFee: flags.integer({
            description: "multisig fee",
            default: 5,
        }),
        min: flags.integer({
            description: "minimum number of signatures per transaction",
            default: 2,
        }),
        lifetime: flags.integer({
            description: "lifetime of transaction",
            default: 72,
        }),
        quantity: flags.integer({
            description: "number of signatures per wallet",
            default: 3,
        }),
        skipTests: flags.boolean({
            description: "skip transaction tests",
        }),
    };

    /**
     * Run multi-signature command.
     * @return {void}
     */
    public async run(): Promise<void> {
        // tslint:disable-next-line:no-shadowed-variable
        const { flags } = this.parse(MultiSignatureCommand);

        this.options = flags;

        const approvalWallets = this.generateWallets(this.options.quantity);
        const publicKeys = approvalWallets.map(wallet => `+${wallet.keys.publicKey}`);
        const min = this.options.min ? Math.min(this.options.min, publicKeys.length) : publicKeys.length;

        const testCosts = this.options.skipTests ? 1 : 2;
        const wallets = this.generateWallets();

        await TransferCommand.run({
            wallets,
            amount: (publicKeys.length + 1) * 5 + testCosts,
            skipTesting: true,
        });

        const transactions = this.generateTransactions(wallets, approvalWallets, publicKeys, min);

        if (this.options.copy) {
            this.copyToClipboard(transactions);

            return;
        }

        try {
            const response = await this.sendTransactions(transactions, "multi-signature", !this.options.skipValidation);

            if (!this.options.skipValidation) {
                let hasUnprocessed = false;
                for (const transaction of transactions) {
                    if (!response.accept.includes(transaction.id)) {
                        hasUnprocessed = true;
                        logger.error(`Multi-signature transaction '${transaction.id}' was not processed`);
                    }
                }
                if (hasUnprocessed) {
                    process.exit(1);
                }

                for (const transaction of transactions) {
                    const tx = await this.getTransaction(transaction.id);
                    if (!tx) {
                        logger.error(`Transaction '${transaction.id}' should be on the blockchain`);
                    }
                }
            }
        } catch (error) {
            const message = error.response ? error.response.data.message : error.message;
            logger.error(`There was a problem sending multi-signature transactions: ${message}`);
            process.exit(1);
        }

        if (this.options.skipTests || this.options.skipValidation) {
            return;
        }

        await this.__testSendWithSignatures(transfer, wallets, approvalWallets);
        await this.__testSendWithMinSignatures(transfer, wallets, approvalWallets, min);
        await this.__testSendWithBelowMinSignatures(transfer, wallets, approvalWallets, min);
        await this.__testSendWithoutSignatures(transfer, wallets);
        await this.__testSendWithEmptySignatures(transfer, wallets);
        await this.__testNewMultiSignatureRegistration(wallets, approvalWallets, publicKeys, min);
    }

    /**
     * Generate batch of transactions based on wallets
     * @param  {Object[]}  wallets
     * @param  {Object[]}  [approvalWallets=[]]
     * @param  {String[]}  [publicKeys=[]]
     * @param  {Number}  [min=2]
     * @param  {Boolean} [log=true]
     * @return {Object[]}
     */
    public generateTransactions(wallets, approvalWallets = [], publicKeys = [], min = 2, log = true) {
        const transactions = [];
        wallets.forEach((wallet, i) => {
            const builder = client.getBuilder().multiSignature();

            builder
                .fee(BaseCommand.parseFee(this.options.multisigFee))
                .multiSignatureAsset({
                    lifetime: this.options.lifetime,
                    keysgroup: publicKeys,
                    min,
                })
                .network(this.config.network.version)
                .sign(wallet.passphrase);

            if (wallet.secondPassphrase || this.config.secondPassphrase) {
                builder.secondSign(wallet.secondPassphrase || this.config.secondPassphrase);
            }

            if (approvalWallets) {
                for (let j = approvalWallets.length - 1; j >= 0; j--) {
                    builder.multiSignatureSign(approvalWallets[j].passphrase);
                }
            }

            const transaction = builder.build();
            transactions.push(transaction);

            if (log) {
                logger.info(
                    `${i} ==> ${transaction.id}, ${wallet.address} (fee: ${BaseCommand.__arktoshiToArk(
                        transaction.fee,
                    )})`,
                );
            }
        });

        return transactions;
    }

    /**
     * Send transactions with approver signatures.
     * @param  {TransferCommand} transfer
     * @param  {Object[]} wallets
     * @param  {Object[]} [approvalWallets=[]]
     * @return {void}
     */
    public async __testSendWithSignatures(transfer, wallets, approvalWallets = []) {
        logger.info("Sending transactions with signatures");

        const transactions = transfer.generateTransactions(BaseCommand.__arkToArktoshi(2), wallets, approvalWallets);

        try {
            await this.sendTransactions(transactions);
            for (const transaction of transactions) {
                const tx = await this.getTransaction(transaction.id);
                if (!tx) {
                    logger.error(`Transaction '${transaction.id}' should be on the blockchain`);
                }
            }
        } catch (error) {
            this.__problemSendingTransactions(error);
        }
    }

    /**
     * Send transactions with min approver signatures.
     * @param  {TransferCommand} transfer
     * @param  {Object[]} wallets
     * @param  {Object[]} [approvalWallets=[]]
     * @param  {Number} [min=2]
     * @return {void}
     */
    public async __testSendWithMinSignatures(transfer, wallets, approvalWallets = [], min = 2) {
        logger.info(
            `Sending transactions with ${min} (min) of ${pluralize("signature", approvalWallets.length, true)}`,
        );

        const transactions = transfer.generateTransactions(
            BaseCommand.__arkToArktoshi(2),
            wallets,
            take(approvalWallets, min),
        );

        try {
            await this.sendTransactions(transactions);
            for (const transaction of transactions) {
                const tx = await this.getTransaction(transaction.id);
                if (!tx) {
                    logger.error(`Transaction '${transaction.id}' should be on the blockchain`);
                }
            }
        } catch (error) {
            this.__problemSendingTransactions(error);
        }
    }

    /**
     * Send transactions with below min approver signatures.
     * @param  {TransferCommand} transfer
     * @param  {Object[]} wallets
     * @param  {Object[]} [approvalWallets=[]]
     * @param  {Number} [min=2]
     * @return {void}
     */
    public async __testSendWithBelowMinSignatures(transfer, wallets, approvalWallets = [], min = 2) {
        const max = min - 1;
        logger.info(
            `Sending transactions with ${max} (below min) of ${pluralize("signature", approvalWallets.length, true)}`,
        );

        const transactions = transfer.generateTransactions(
            BaseCommand.__arkToArktoshi(2),
            wallets,
            take(approvalWallets, max),
        );

        try {
            await this.sendTransactions(transactions);
            for (const transaction of transactions) {
                try {
                    const tx = await this.getTransaction(transaction.id);
                    if (tx) {
                        logger.error(`Transaction '${transaction.id}' should not be on the blockchain`);
                    }
                } catch (error) {
                    const message = error.response ? error.response.data.message : error.message;
                    if (message !== "Transaction not found") {
                        logger.error(`Failed to check transaction '${transaction.id}': ${message}`);
                    }
                }
            }
        } catch (error) {
            this.__problemSendingTransactions(error);
        }
    }

    /**
     * Send transactions without approver signatures.
     * @param  {TransferCommand} transfer
     * @param  {Object[]} wallets
     * @return {void}
     */
    public async __testSendWithoutSignatures(transfer, wallets) {
        logger.info("Sending transactions without signatures");

        const transactions = transfer.generateTransactions(BaseCommand.__arkToArktoshi(2), wallets);

        try {
            await this.sendTransactions(transactions);
            for (const transaction of transactions) {
                try {
                    const tx = await this.getTransaction(transaction.id);
                    if (tx) {
                        logger.error(`Transaction '${transaction.id}' should not be on the blockchain`);
                    }
                } catch (error) {
                    const message = error.response ? error.response.data.message : error.message;
                    if (message !== "Transaction not found") {
                        logger.error(`Failed to check transaction '${transaction.id}': ${message}`);
                    }
                }
            }
        } catch (error) {
            this.__problemSendingTransactions(error);
        }
    }

    /**
     * Send transactions with empty approver signatures.
     * @param  {TransferCommand} transfer
     * @param  {Object[]} wallets
     * @return {void}
     */
    public async __testSendWithEmptySignatures(transfer, wallets) {
        logger.info("Sending transactions with empty signatures");

        const transactions = transfer.generateTransactions(BaseCommand.__arkToArktoshi(2), wallets);
        for (const transaction of transactions) {
            transaction.data.signatures = [];
        }

        try {
            await this.sendTransactions(transactions);
            for (const transaction of transactions) {
                try {
                    const tx = await this.getTransaction(transaction.id);
                    if (tx) {
                        logger.error(`Transaction '${transaction.id}' should not be on the blockchain`);
                    }
                } catch (error) {
                    const message = error.response ? error.response.data.message : error.message;
                    if (message !== "Transaction not found") {
                        logger.error(`Failed to check transaction '${transaction.id}': ${message}`);
                    }
                }
            }
        } catch (error) {
            this.__problemSendingTransactions(error);
        }
    }

    /**
     * Send transactions to re-register multi-signature wallets.
     * @param  {Object[]} wallets
     * @param  {Object[]} [approvalWallets=[]]
     * @param  {Object[]} [publicKeys=[]]
     * @param  {Number} [min=2]
     * @return {void}
     */
    public async __testNewMultiSignatureRegistration(wallets, approvalWallets = [], publicKeys = [], min = 2) {
        logger.info("Sending transactions to re-register multi-signature");

        const transactions = this.generateTransactions(wallets, approvalWallets, publicKeys, min);

        try {
            await this.sendTransactions(transactions);
            for (const transaction of transactions) {
                try {
                    const tx = await this.getTransaction(transaction.id);
                    if (tx) {
                        logger.error(`Transaction '${transaction.id}' should not be on the blockchain`);
                    }
                } catch (error) {
                    const message = error.response ? error.response.data.message : error.message;
                    if (message !== "Transaction not found") {
                        logger.error(`Failed to check transaction '${transaction.id}': ${message}`);
                    }
                }
            }
        } catch (error) {
            this.__problemSendingTransactions(error);
        }
    }
}
