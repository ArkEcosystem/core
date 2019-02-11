import { ITransactionData } from "../models";

/**
 * Sort transactions by type, then id.
 */
export const sortTransactions = (transactions: ITransactionData[]): ITransactionData[] =>
    transactions.sort((a, b) => {
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
