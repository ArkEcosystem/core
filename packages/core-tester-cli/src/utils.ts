import { client } from "@arkecosystem/crypto";
import axios from "axios";
import pino from "pino";

export const logger = pino({
    name: "core-tester-cli",
    safe: true,
    prettyPrint: true,
});

export function request(config) {
    const headers: any = {};
    if (config && config.network) {
        headers.nethash = config.network.nethash;
        headers.version = "2.0.0";
        headers.port = config.p2pPort;
        headers["Content-Type"] = "application/json";
    }

    return {
        get: async (endpoint, isP2P = false) => {
            const baseUrl = `${config.baseUrl}:${isP2P ? config.p2pPort : config.apiPort}`;

            return (await axios.get(baseUrl + endpoint, { headers })).data;
        },
        post: async (endpoint, data, isP2P = false) => {
            const baseUrl = `${config.baseUrl}:${isP2P ? config.p2pPort : config.apiPort}`;

            return (await axios.post(baseUrl + endpoint, data, { headers })).data;
        },
    };
}

export async function paginate(config, endpoint) {
    const data = [];
    let page = 1;
    let maxPages = null;
    while (maxPages === null || page <= maxPages) {
        const response = await request(config).get(`${endpoint}?page=${page}`);
        if (response) {
            page++;
            maxPages = response.meta.pageCount;
            data.push(...response.data);
        } else {
            break;
        }
    }

    return data;
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
export function generateTransactions(
    transactionAmount,
    wallets,
    approvalWallets = [],
    overridePassphrase = false,
    vendorField = null,
    log = true,
) {
    const transactions = [];
    wallets.forEach((wallet, i) => {
        const builder = client.getBuilder().transfer();
        // noinspection JSCheckFunctionSignatures
        builder
            .fee(this.parseFee(this.options.transferFee))
            .recipientId(this.options.recipient || wallet.address)
            .network(this.config.network.version)
            .amount(transactionAmount)
            .vendorField(vendorField === undefined ? `Transaction ${i + 1}` : vendorField)
            .sign(overridePassphrase ? this.config.passphrase : wallet.passphrase);

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
                `${i} ==> ${transaction.id}, ${transaction.recipientId} (fee: ${this.arktoshiToArk(transaction.fee)})`,
            );
        }
    });

    return transactions;
}
