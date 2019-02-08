import { Transaction } from "@arkecosystem/crypto";

/**
 * Deserialize multiple transactions
 */
export async function unserializeTransactions(data) {
    const deserialize = buffer => {
        return Transaction.fromBytes(buffer);
    };

    if (Array.isArray(data)) {
        return data.reduce((total, value, key) => {
            total.push(deserialize(value.serialized));

            return total;
        }, []);
    }
    return deserialize(data);
}
