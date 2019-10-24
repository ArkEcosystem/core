import { Utils } from "@arkecosystem/core-kernel";
import { Identities, Managers } from "@arkecosystem/crypto";

/**
 * Get the unitnet genesis delegates information
 * @return {Array} array of objects like { secret, publicKey, address, balance }
 */

Managers.configManager.setFromPreset("unitnet");

import { secrets } from "../config/delegates.json";
import { genesisBlock } from "../config/genesisBlock";

export const delegates: any = secrets.map(secret => {
    const publicKey: string = Identities.PublicKey.fromPassphrase(secret);
    const address: string = Identities.Address.fromPassphrase(secret);

    const transaction: { amount: string } = Utils.assert.defined(
        genesisBlock.transactions.find(transaction => transaction.recipientId === address && transaction.type === 0),
    );

    return {
        secret,
        passphrase: secret, // just an alias for delegate secret
        publicKey,
        address,
        balance: transaction.amount,
    };
});
