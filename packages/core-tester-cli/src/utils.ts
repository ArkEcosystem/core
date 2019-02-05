import { bignumify } from "@arkecosystem/core-utils";
import { Bignum, client, formatArktoshi } from "@arkecosystem/crypto";
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
 */
export function generateTransactions(
    amountPerTransaction: any,
    wallets: any[],
    approvalWallets: any[],
    options: {
        config: any;
        overridePassphrase?: false;
        vendorField?: string;
        log?: boolean;
        [key: string]: any;
    },
) {
    const transactions = [];
    wallets.forEach((wallet, i) => {
        const builder = client.getBuilder().transfer();
        // noinspection JSCheckFunctionSignatures
        builder
            .fee(this.parseFee(options.transferFee))
            .recipientId(options.recipient || wallet.address)
            .network(options.config.network.version)
            .amount(amountPerTransaction)
            .vendorField(options.vendorField === undefined ? `Transaction ${i + 1}` : options.vendorField)
            .sign(options.overridePassphrase ? options.config.passphrase : wallet.passphrase);

        if (wallet.secondPassphrase || options.config.secondPassphrase) {
            builder.secondSign(wallet.secondPassphrase || options.config.secondPassphrase);
        }

        if (approvalWallets) {
            for (let j = approvalWallets.length - 1; j >= 0; j--) {
                builder.multiSignatureSign(approvalWallets[j].passphrase);
            }
        }

        const transaction = builder.build();
        transactions.push(transaction);

        if (options.log) {
            logger.info(
                `${i} ==> ${transaction.id}, ${transaction.recipientId} (fee: ${this.arktoshiToArk(transaction.fee)})`,
            );
        }
    });

    return transactions;
}

/**
 * Parse fee based on input.
 * @param  {(String|Number)} fee
 * @return {Bignum}
 */
export function parseFee(fee): Bignum {
    if (typeof fee === "string" && fee.indexOf("-") !== -1) {
        const feeRange = fee.split("-").map(
            f =>
                +bignumify(f)
                    .times(1e8)
                    .toFixed(),
        );
        if (feeRange[1] < feeRange[0]) {
            return bignumify(feeRange[0]);
        }

        return bignumify(Math.floor(Math.random() * (feeRange[1] - feeRange[0] + 1) + feeRange[0]));
    }

    return bignumify(fee).times(1e8);
}

/**
 * Convert ARK to Arktoshi.
 * @param  {Number} ark
 * @return {Bignum}
 */
export function arkToArktoshi(ark) {
    return bignumify(ark * 1e8);
}

/**
 * Convert Arktoshi to ARK.
 * @param  {Bignum} arktoshi
 * @return {String}
 */
export function arktoshiToArk(arktoshi) {
    return formatArktoshi(arktoshi);
}
