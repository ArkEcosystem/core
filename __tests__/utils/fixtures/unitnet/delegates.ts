import { configManager, crypto } from "@arkecosystem/crypto";

/**
 * Get the unitnet genesis delegates information
 * @return {Array} array of objects like { secret, publicKey, address, balance }
 */

configManager.setFromPreset("unitnet");

import { secrets } from "../../config/unitnet/delegates.json";
import { transactions as genesisTransactions } from "../../config/unitnet/genesisBlock.json";

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
