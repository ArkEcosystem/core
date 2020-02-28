import { Identities, Interfaces } from "@arkecosystem/crypto";

import { Delegate } from "../interfaces";
import { Method } from "./method";

/**
 * @export
 * @class BIP39
 * @extends {Method}
 */
export class BIP39 extends Method implements Delegate {
    /**
     * @type {Interfaces.IKeyPair}
     * @memberof BIP39
     */
    public keys: Interfaces.IKeyPair | undefined;

    /**
     * @type {string}
     * @memberof BIP39
     */
    public publicKey: string;

    /**
     * @type {string}
     * @memberof BIP39
     */
    public address: string;

    /**
     * @param {string} passphrase
     * @memberof BIP39
     */
    public constructor(passphrase: string) {
        super();

        this.keys = Identities.Keys.fromPassphrase(passphrase);
        this.publicKey = this.keys.publicKey;
        this.address = Identities.Address.fromPublicKey(this.publicKey);
    }

    /**
     * @param {Interfaces.ITransactionData[]} transactions
     * @param {Record<string, any>} options
     * @returns {(Interfaces.IBlock | undefined)}
     * @memberof BIP39
     */
    public forge(transactions: Interfaces.ITransactionData[], options: Record<string, any>): Interfaces.IBlock {
        return this.createBlock(this.keys!, transactions, options);
    }
}
