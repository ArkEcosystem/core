/**
 * Sort transactions by type, then id.
 * @param  {Transaction[]} transactions
 * @return {Transaction[]}
 */
export const sortTransactions = transactions =>
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
