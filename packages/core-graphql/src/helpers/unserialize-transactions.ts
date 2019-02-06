import { AbstractTransaction } from "@arkecosystem/crypto";

/**
 * Deserialize multiple transactions
 */
export async function unserializeTransactions(data) {
    const deserialize = buffer => {
        const serialized = Buffer.from(buffer).toString("hex");
        return AbstractTransaction.fromHex(serialized);
    };

    if (Array.isArray(data)) {
        return data.reduce((total, value, key) => {
            total.push(deserialize(value.serialized));

            return total;
        }, []);
    }
    return deserialize(data);
}
