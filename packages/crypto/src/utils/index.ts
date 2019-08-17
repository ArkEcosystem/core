import { SATOSHI } from "../constants";
import { IBlockData, ITransactionData } from "../interfaces";
import { configManager } from "../managers/config";
import { Base58 } from "./base58";
import { BigNumber } from "./bignum";

let genesisTransactions: { [key: string]: boolean };
let currentNetwork: number;

/**
 * Get human readable string from satoshis
 */
export const formatSatoshi = (amount: BigNumber): string => {
    const localeString = (+amount / SATOSHI).toLocaleString("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8,
    });

    return `${localeString} ${configManager.get("network.client.symbol")}`;
};

/**
 * Check if the given block or transaction id is an exception.
 */
export const isException = (blockOrTransaction: IBlockData | ITransactionData): boolean => {
    return ["blocks", "transactions"].some(key => {
        const exceptions = configManager.get(`exceptions.${key}`);
        return Array.isArray(exceptions) && exceptions.includes(blockOrTransaction.id);
    });
};

export const isGenesisTransaction = (id: string): boolean => {
    const network: number = configManager.get("network.pubKeyHash");

    if (!genesisTransactions || currentNetwork !== network) {
        currentNetwork = network;

        genesisTransactions = configManager
            .get("genesisBlock.transactions")
            .reduce((acc, curr) => Object.assign(acc, { [curr.id]: true }), {});
    }

    return genesisTransactions[id];
};

export const numberToHex = (num: number, padding = 2): string => {
    const indexHex: string = Number(num).toString(16);

    return "0".repeat(padding - indexHex.length) + indexHex;
};

export const maxVendorFieldLength = (height?: number): number => configManager.getMilestone(height).vendorFieldLength;

export const isSupportedTansactionVersion = (version: number): boolean => {
    const aip11: boolean = configManager.getMilestone().aip11;

    if (aip11 && version === 1) {
        return false;
    }

    if (!aip11 && version > 1) {
        return false;
    }

    return true;
};

export { Base58, BigNumber };
