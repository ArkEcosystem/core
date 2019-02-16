import { Bignum, crypto } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import delay from "delay";
import unique from "lodash/uniq";
import pluralize from "pluralize";
import { arkToSatoshi, generateTransactions, logger, satoshiToArk } from "../utils";
import { BaseCommand } from "./command";

export class TransferCommand extends BaseCommand {
    public static description: string = "send multiple transactions";

    public static flags = {
        ...BaseCommand.flags,
        recipient: flags.string({
            description: "recipient address",
        }),
        floodAttempts: flags.integer({
            description: "flood node with same transactions",
            default: 0,
        }),
        skipSecondRun: flags.string({
            description: "skip second sending of transactions",
        }),
        smartBridge: flags.string({
            description: "smart-bridge value to use",
        }),
    };

    /**
     * Run transfer command.
     * @param  {Object} options
     * @return {void}
     */
    public async run(): Promise<void> {
        await this.initialize(TransferCommand);

        const primaryAddress = crypto.getAddress(
            crypto.getKeys(this.config.passphrase).publicKey,
            this.config.network.version,
        );

        let wallets = this.options.wallets;
        if (wallets === undefined) {
            wallets = this.generateWallets();
        }

        logger.info(`Sending ${wallets.length} transfer ${pluralize("transaction", wallets.length)}`);

        const walletBalance = await this.getWalletBalance(primaryAddress);

        if (!this.options.skipValidation) {
            logger.info(`Sender starting balance: ${satoshiToArk(walletBalance)}`);
        }

        let totalDeductions = Bignum.ZERO;
        const transactionAmount = arkToSatoshi(this.options.amount || 2);

        const transactions = this.generateTransactions(transactionAmount, wallets, null, true);
        for (const transaction of transactions) {
            totalDeductions = totalDeductions.plus(transactionAmount).plus(transaction.fee);
        }

        if (this.options.copy) {
            this.copyToClipboard(transactions);
            return;
        }

        const expectedSenderBalance = new Bignum(walletBalance).minus(totalDeductions);
        if (!this.options.skipValidation) {
            logger.info(`Sender expected ending balance: ${satoshiToArk(expectedSenderBalance)}`);
        }

        const runOptions = {
            primaryAddress,
            transactions,
            wallets,
            transactionAmount,
            expectedSenderBalance,
            skipValidation: this.options.skipValidation,
        };

        try {
            if (!this.options.floodAttempts) {
                const successfulTest = await this.performRun(runOptions, 1);
                if (
                    successfulTest &&
                    !this.options.skipSecondRun &&
                    !this.options.skipValidation &&
                    !this.options.skipTesting
                ) {
                    await this.performRun(runOptions, 2, false, true);
                }
            } else {
                const attempts = this.options.floodAttempts;
                for (let i = attempts; i > 0; i--) {
                    await this.performRun(runOptions, attempts - i + 1, i !== 1, i !== attempts);
                }
            }
        } catch (error) {
            const message = error.response ? error.response.data.message : error;
            logger.error(`There was a problem sending transactions: ${message}`);
        }

        if (this.options.skipValidation) {
            return;
        }

        await this.testVendorField(wallets);
        await this.testEmptyVendorField(wallets);

        return;
    }

    /**
     * Generate batch of transactions based on wallets.
     * @param  {Bignum}  transactionAmount
     * @param  {Object[]}  wallets
     * @param  {Object[]}  [approvalWallets=[]]
     * @param  {Boolean}  [overridePassphrase=false]
     * @param  {String}  [vendorField]
     * @param  {Boolean} [log=true]
     * @return {Object[]}
     */
    public generateTransactions(
        transactionAmount,
        wallets,
        approvalWallets = [],
        overridePassphrase = false,
        vendorField = null,
        log = true,
    ) {
        return generateTransactions(transactionAmount, wallets, approvalWallets, {
            ...this.options,
            config: this.config,
            overridePassphrase,
            vendorField: vendorField || this.options.smartBridge,
            log,
        });
    }

    /**
     * Perform a run of transactions.
     * @param  {Object}  runOptions
     * @param  {Number}  [runNumber=1]
     * @param  {Boolean}  [skipWait=false]
     * @param  {Boolean} [isSubsequentRun=false]
     * @return {Boolean}
     */
    public async performRun(runOptions, runNumber = 1, skipWait = false, isSubsequentRun = false) {
        if (skipWait) {
            runOptions.skipValidation = true;
            this.sendTransactionsWithResults(runOptions, isSubsequentRun);

            return true;
        }

        if (await this.sendTransactionsWithResults(runOptions, isSubsequentRun)) {
            logger.info(`All transactions have been received and forged for run ${runNumber}!`);

            return true;
        }

        logger.error(`Test failed on run ${runNumber}`);

        return false;
    }

    /**
     * Send transactions and validate results.
     * @param  {Object} runOptions
     * @param  {Boolean} isSubsequentRun
     * @return {Boolean}
     */
    public async sendTransactionsWithResults(runOptions, isSubsequentRun) {
        let successfulTest = true;

        let postResponse;
        try {
            postResponse = await this.postTransactions(runOptions.transactions);
        } catch (error) {
            if (runOptions.skipValidation) {
                return true;
            }

            const message = error.response ? error.response.data.error : error.message;
            logger.error(`Transaction request failed: ${message}`);

            return false;
        }

        if (runOptions.skipValidation) {
            return true;
        }

        if (!isSubsequentRun && (!postResponse.accept || !postResponse.accept.length)) {
            return false;
        }

        if (!isSubsequentRun) {
            for (const transaction of runOptions.transactions) {
                if (!postResponse.accept.includes(transaction.id)) {
                    logger.error(`Transaction '${transaction.id}' didn't get approved on the network`);

                    successfulTest = false;
                }
            }
        }

        for (const key of Object.keys(postResponse)) {
            if (key === "success") {
                continue;
            }

            const dataLength = postResponse[key].length;
            const uniqueLength = unique(postResponse[key]).length;
            if (dataLength !== uniqueLength) {
                logger.error(`Response data for '${key}' has ${dataLength - uniqueLength} duplicate transaction ids`);
                successfulTest = false;
            }
        }

        const delaySeconds = this.getTransactionDelaySeconds(runOptions.transactions);
        logger.info(`Waiting ${delaySeconds} seconds to apply transfer transactions`);
        await delay(delaySeconds * 1000);

        for (const transaction of runOptions.transactions) {
            const transactionResponse = await this.getTransaction(transaction.id);
            if (transactionResponse && transactionResponse.id !== transaction.id) {
                logger.error(`Transaction '${transaction.id}' didn't get applied on the network`);

                successfulTest = false;
            }
        }

        if (runOptions.primaryAddress && runOptions.expectedSenderBalance) {
            const walletBalance = await this.getWalletBalance(runOptions.primaryAddress);
            if (!walletBalance.isEqualTo(runOptions.expectedSenderBalance)) {
                successfulTest = false;
                logger.error(
                    `Sender balance incorrect: '${satoshiToArk(walletBalance)}' but should be '${satoshiToArk(
                        runOptions.expectedSenderBalance,
                    )}'`,
                );
            }
        }

        for (const wallet of runOptions.wallets) {
            const balance = await this.getWalletBalance(wallet.address);
            if (!balance.isEqualTo(runOptions.transactionAmount)) {
                successfulTest = false;
                logger.error(
                    `Incorrect destination balance for ${wallet.address}. Should be '${satoshiToArk(
                        runOptions.transactionAmount,
                    )}' but is '${satoshiToArk(balance)}'`,
                );
            }
        }

        return successfulTest;
    }

    /**
     * Test vendor field is set correctly on blockchain.
     * @param  {Object[]} wallets
     * @return {void}
     */
    public async testVendorField(wallets) {
        logger.info("Testing VendorField value is set correctly");

        const transactions = this.generateTransactions(arkToSatoshi(2), wallets, null, null, "Testing VendorField");

        try {
            await this.sendTransactions(transactions);

            for (const transaction of transactions) {
                const tx = await this.getTransaction(transaction.id);
                if (!tx) {
                    logger.error(`Transaction '${transaction.id}' should be on the blockchain`);
                } else if (tx.vendorField !== "Testing VendorField") {
                    logger.error(`Transaction '${transaction.id}' does not have correct vendorField value`);
                }
            }
        } catch (error) {
            this.problemSendingTransactions(error);
        }
    }

    /**
     * Test empty vendor field is set correctly on blockchain.
     * @param  {Object[]} wallets
     * @return {void}
     */
    public async testEmptyVendorField(wallets) {
        logger.info("Testing empty VendorField value");

        const transactions = this.generateTransactions(arkToSatoshi(2), wallets, null, null, null);

        try {
            await this.sendTransactions(transactions);

            for (const transaction of transactions) {
                const tx = await this.getTransaction(transaction.id);
                if (!tx) {
                    logger.error(`Transaction '${transaction.id}' should be on the blockchain`);
                } else if (tx.vendorField) {
                    logger.error(
                        `Transaction '${transaction.id}' should not have vendorField value '${tx.vendorField}'`,
                    );
                }
            }
        } catch (error) {
            this.problemSendingTransactions(error);
        }
    }
}
