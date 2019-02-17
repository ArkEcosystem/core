import BigNumber from "bignumber.js";
import { SATOSHI } from "./constants";
import { configManager } from "./managers";
import { IBlockData, ITransactionData } from "./models";

class Bignum extends BigNumber {
    public static readonly ZERO = new BigNumber(0);
    public static readonly ONE = new BigNumber(1);
}

Bignum.config({ DECIMAL_PLACES: 0 });

/**
 * Get human readable string from satoshis
 */
export function formatSatoshis(amount: Bignum | number | string): string {
    const localeString = (+amount / SATOSHI).toLocaleString("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8,
    });

    return `${localeString} ${configManager.config.client.symbol}`;
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

export { Bignum };
