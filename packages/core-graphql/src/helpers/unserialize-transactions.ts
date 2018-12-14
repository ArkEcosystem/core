import { models } from "@arkecosystem/crypto";
const { Transaction } = models;

/**
 * Deserialize multiple transactions
 */
export async function unserializeTransactions(data) {
    const deserialize = buffer => {
        const serialized = Buffer.from(buffer).toString("hex");
        return Transaction.deserialize(serialized);
    };

    if (Array.isArray(data)) {
        return data.reduce((total, value, key) => {
            total.push(deserialize(value.serialized));

            return total;
        }, []);
    }
    return deserialize(data);
}
