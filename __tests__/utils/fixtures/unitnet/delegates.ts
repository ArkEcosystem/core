import { Crypto, Managers } from "@arkecosystem/crypto";

/**
 * Get the unitnet genesis delegates information
 * @return {Array} array of objects like { secret, publicKey, address, balance }
 */

Managers.configManager.setFromPreset("unitnet");

import { secrets } from "../../config/unitnet/delegates.json";
import { genesisBlock } from "../../config/unitnet/genesisBlock";

export const delegates: any = secrets.map(secret => {
    const publicKey = Crypto.crypto.getKeys(secret).publicKey;
    const address = Crypto.crypto.getAddress(publicKey);
    const balance = genesisBlock.transactions.find(
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
