import { SATOSHI } from "../constants";
import { IBlockData, ITransactionData } from "../interfaces";
import { configManager } from "../managers";
import { BigNumber } from "./bignum";

/**
 * Get human readable string from satoshis
 */
export function formatSatoshi(amount: BigNumber): string {
    const localeString = (+amount / SATOSHI).toLocaleString("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8,
    });

    return `${localeString} ${configManager.get("network.client.symbol")}`;
}

/**
 * Check if the given block or transaction id is an exception.
 */
export function isException(blockOrTransaction: IBlockData | ITransactionData): boolean {
    return ["blocks", "transactions"].some(key => {
        const exceptions = configManager.get(`exceptions.${key}`);
        return Array.isArray(exceptions) && exceptions.includes(blockOrTransaction.id);
    });
}

/**
 * Sort transactions by type, then id.
 */
export function sortTransactions(transactions: ITransactionData[]): ITransactionData[] {
    return transactions.sort((a, b) => {
        if (a.type < b.type) {
            return -1;
        }

        if (a.type > b.type) {
            return 1;
        }

        if (a.id < b.id) {
            return -1;
        }

        if (a.id > b.id) {
            return 1;
        }

        return 0;
    });
}

export const isGenesisTransaction = (id: string): boolean => {
    let genesisTransactions: { [key: string]: boolean };
    let currentNetwork: number;

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
    const indexHex = Number(num).toString(16);
    return "0".repeat(padding - indexHex.length) + indexHex;
};

export const maxVendorFieldLength = (height?: number): number => configManager.getMilestone(height).vendorFieldLength;

export { BigNumber };
