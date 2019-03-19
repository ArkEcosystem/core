import { client, crypto } from "@arkecosystem/crypto";

/**
 * Get the testnet genesis delegates information
 * @return {Array} array of objects like { secret, publicKey, address, balance }
 */

client.getConfigManager().setFromPreset("testnet");

import { secrets } from "../../config/testnet/delegates.json";
import { transactions as genesisTransactions } from "../../config/testnet/genesisBlock.json";

export const delegates: any = secrets.map(secret => {
    const publicKey = crypto.getKeys(secret).publicKey;
    const address = crypto.getAddress(publicKey);
    const balance = genesisTransactions.find(
        transaction => transaction.recipientId === address && transaction.type === 0,
    ).amount;
    return {
        secret,
        passphrase: secret, // just an alias for delegate secret
        publicKey,
        address,
        balance,
    };
});
