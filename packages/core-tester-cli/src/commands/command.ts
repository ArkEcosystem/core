import { bignumify } from "@arkecosystem/core-utils";
import { Bignum, crypto } from "@arkecosystem/crypto";
import Command, { flags } from "@oclif/command";
import bip39 from "bip39";
import clipboardy from "clipboardy";
import delay from "delay";
import fs from "fs";
import path from "path";
import pluralize from "pluralize";
import { config } from "../config";
import { customFlags } from "../flags";
import { logger, paginate, request } from "../utils";

export abstract class BaseCommand extends Command {
    public static flags = {
        number: flags.integer({
            description: "number of wallets",
            default: 10,
        }),
        amount: customFlags.number({
            description: "initial wallet token amount",
            default: 2,
        }),
        transferFee: customFlags.number({
            description: "transfer fee",
            default: 0.1,
        }),
        baseUrl: flags.string({
            description: "base api url",
        }),
        apiPort: flags.integer({
            description: "base api port",
            default: 4003,
        }),
        p2pPort: flags.integer({
            description: "base p2p port",
            default: 4002,
        }),
        passphrase: flags.string({
            description: "passphrase of initial wallet",
        }),
        secondPassphrase: flags.string({
            description: "second passphrase of initial wallet",
        }),
        skipValidation: flags.boolean({
            description: "skip transaction validations",
        }),
        skipTesting: flags.boolean({
            description: "skip testing",
        }),
        copy: flags.boolean({
            description: "copy the transactions to the clipboard",
        }),
    };

    public options: any;
    public config: any;

    /**
     * Init new instance of command.
     * @param  {Object} options
     * @return {*}
     */
    public async initialize(command): Promise<any> {
        // tslint:disable-next-line:no-shadowed-variable
        const { flags } = this.parse(command);

        this.options = flags;
        this.applyConfig();
        await this.loadConstants();
        await this.loadNetworkConfig();

        return { flags };
    }

    /**
     * Copy transactions to clipboard.
     * @param  {Object[]} transactions
     * @return {void}
     */
    public copyToClipboard(transactions) {
        for (const transaction of transactions) {
            transaction.serialized = transaction.serialized.toString("hex");
        }

        clipboardy.writeSync(JSON.stringify(transactions));
        logger.info(`Copied ${pluralize("transaction", transactions.length, true)}`);
    }

    /**
     * Generate wallets based on quantity.
     * @param  {Number} [quantity]
     * @return {Object[]}
     */
    public generateWallets(quantity: any = null) {
        if (!quantity) {
            quantity = this.options.number;
        }

        const wallets = [];
        for (let i = 0; i < quantity; i++) {
            const passphrase = bip39.generateMnemonic();
            const keys = crypto.getKeys(passphrase);
            const address = crypto.getAddress(keys.publicKey, this.config.network.version);

            wallets.push({ address, keys, passphrase });
        }

        const testWalletsPath = path.resolve(__dirname, "../../test-wallets");
        fs.appendFileSync(testWalletsPath, `${new Date().toLocaleDateString()} ${"-".repeat(70)}\n`);
        for (const wallet of wallets) {
            fs.appendFileSync(testWalletsPath, `${wallet.address}: ${wallet.passphrase}\n`);
        }

        return wallets;
    }

    /**
     * Get delegate API response.
     * @return {Object[]}
     * @throws 'Could not get delegates'
     */
    public async getDelegates() {
        try {
            const delegates = await paginate(this.config, "/api/v2/delegates");

            return delegates;
        } catch (error) {
            const message = error.response ? error.response.data.message : error.message;
            throw new Error(`Could not get delegates: ${message}`);
        }
    }

    /**
     * Get transaction from API by ID.
     * @param  {String} id
     * @return {(Object|null)}
     */
    public async getTransaction(id) {
        try {
            const response = await request(this.config).get(`/api/v2/transactions/${id}`);

            if (response.data) {
                return response.data;
            }
        } catch (error) {
            //
        }

        return null;
    }

    /**
     * Get delegate voters by public key.
     * @param  {String} publicKey
     * @return {Object[]}
     */
    public async getVoters(publicKey) {
        try {
            return paginate(this.config, `/api/v2/delegates/${publicKey}/voters`);
        } catch (error) {
            const message = error.response ? error.response.data.message : error.message;
            throw new Error(`Could not get voters for '${publicKey}': ${message}`);
        }
    }

    /**
     * Get wallet balance by address.
     * @param  {String} address
     * @return {Bignum}
     */
    public async getWalletBalance(address) {
        try {
            return bignumify((await this.getWallet(address)).balance);
        } catch (error) {
            //
        }

        return Bignum.ZERO;
    }

    /**
     * Get wallet by address.
     * @param  {String} address
     * @return {Object}
     */
    public async getWallet(address) {
        try {
            const response = await request(this.config).get(`/api/v2/wallets/${address}`);

            if (response.data) {
                return response.data;
            }

            return null;
        } catch (error) {
            const message = error.response ? error.response.data.message : error.message;
            throw new Error(`Could not get wallet for '${address}': ${message}`);
        }
    }

    /**
     * Send transactions to API and wait for response.
     * @param  {Object[]}  transactions
     * @param  {String}  [transactionType]
     * @param  {Boolean} [wait=true]
     * @return {Object}
     */
    public async sendTransactions(transactions, transactionType: any = null, wait = true) {
        const response = await this.postTransactions(transactions);

        if (wait) {
            const delaySeconds = this.getTransactionDelaySeconds(transactions);
            transactionType = `${transactionType ? `${transactionType} ` : ""}transactions`;
            logger.info(`Waiting ${delaySeconds} seconds to apply ${transactionType}`);
            await delay(delaySeconds * 1000);
        }

        return response;
    }

    /**
     * Send transactions to API.
     * @param  {Object[]} transactions
     * @return {Object}
     */
    public async postTransactions(transactions) {
        try {
            const response = await request(this.config).post("/api/v2/transactions", {
                transactions,
            });
            return response.data;
        } catch (error) {
            const message = error.response ? error.response.data.message : error.message;
            throw new Error(`Could not post transactions: ${message}`);
        }
    }

    /**
     * Load constants from API and apply to config.
     * @return {void}
     */
    public async loadConstants() {
        try {
            this.config.constants = (await request(this.config).get("/api/v2/node/configuration")).data.constants;
        } catch (error) {
            logger.error("Failed to get constants: ", error.message);
            process.exit(1);
        }
    }

    /**
     * Load network from API and apply to config.
     * @return {void}
     */
    public async loadNetworkConfig() {
        try {
            this.config.network = (await request(this.config).get("/config", true)).data.network;
        } catch (error) {
            logger.error("Failed to get network config: ", error.message);
            process.exit(1);
        }
    }

    /**
     * Apply options to config.
     * @return {void}
     */
    protected applyConfig() {
        this.config = { ...config };

        if (this.options.baseUrl) {
            this.config.baseUrl = this.options.baseUrl.replace(/\/+$/, "");
        }

        if (this.options.apiPort) {
            this.config.apiPort = this.options.apiPort;
        }

        if (this.options.p2pPort && process.env.NODE_ENV !== "test") {
            this.config.p2pPort = this.options.p2pPort;
        }

        if (this.options.passphrase) {
            this.config.passphrase = this.options.passphrase;
        }

        if (this.options.secondPassphrase) {
            this.config.secondPassphrase = this.options.secondPassphrase;
        }
    }

    /**
     * Quit command and output error when problem sending transactions.
     * @param  {Error} error
     * @return {void}
     */
    protected problemSendingTransactions(error) {
        const message = error.response ? error.response.data.message : error.message;
        logger.error(`There was a problem sending transactions: ${message}`);
        process.exit(1);
    }

    /**
     * Determine how long to wait for transactions to process.
     * @param  {Object[]} transactions
     * @return {Number}
     */
    protected getTransactionDelaySeconds(transactions) {
        if (process.env.NODE_ENV === "test") {
            return 0;
        }

        const waitPerBlock = Math.round(this.config.constants.blocktime / 10) * 20;

        return waitPerBlock * Math.ceil(transactions.length / this.config.constants.block.maxTransactions);
    }

    protected castFlags(values: Record<string, any>): string[] {
        return ["number", "baseUrl", "apiPort", "p2pPort", "skipValidation", "skipTesting"]
            .map((key: string) => {
                const value = values[key];

                if (value === undefined) {
                    return undefined;
                }

                if (value === true) {
                    return `--${key}`;
                }

                return `--${key}=${value}`;
            })
            .filter(value => value !== undefined);
    }
}
