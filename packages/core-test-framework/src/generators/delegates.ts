import { Utils } from "@arkecosystem/core-kernel";
import { Identities } from "@arkecosystem/crypto";

import secrets from "../internal/secrets.json";

// import { genesisBlock } from "../utils/config/genesisBlock";

export const delegates: any = genesisBlock =>
    secrets.map(secret => {
        const publicKey: string = Identities.PublicKey.fromPassphrase(secret);
        const address: string = Identities.Address.fromPassphrase(secret);

        const balance: string = genesisBlock.transactions.find(
            transaction => transaction.recipientId === address && transaction.type === 0,
        );

        Utils.assert.defined<number>(balance);

        return {
            secret,
            passphrase: secret, // just an alias for delegate secret
            publicKey,
            address,
            balance,
        };
    });
