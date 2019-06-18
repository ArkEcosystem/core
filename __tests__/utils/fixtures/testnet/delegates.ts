import { Identities, Managers, Utils } from "@arkecosystem/crypto";

Managers.configManager.setFromPreset("testnet");

import { secrets } from "../../config/testnet/delegates.json";
import { genesisBlock } from "../../config/testnet/genesisBlock";

export const delegates: Array<{
    secret: string;
    passphrase: string;
    publicKey: string;
    address: string;
    balance: Utils.BigNumber;
}> = secrets.map(secret => {
    const publicKey: string = Identities.PublicKey.fromPassphrase(secret);
    const address: string = Identities.Address.fromPassphrase(secret);
    const balance: Utils.BigNumber = genesisBlock.transactions.find(
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
