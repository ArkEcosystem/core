import { Blocks, CryptoSuite, Interfaces } from "@arkecosystem/core-crypto";
import { Interfaces as TransactionInterfaces } from "@arkecosystem/crypto";

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
    public keys: TransactionInterfaces.IKeyPair;

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
    public constructor(
        cryptoManager: CryptoSuite.CryptoManager,
        blockFactory: Blocks.BlockFactory,
        passphrase: string,
    ) {
        super(cryptoManager, blockFactory);

        this.keys = this.cryptoManager.Identities.Keys.fromPassphrase(passphrase);
        this.publicKey = this.keys.publicKey;
        this.address = this.cryptoManager.Identities.Address.fromPublicKey(this.publicKey);
    }

    /**
     * @param {Interfaces.ITransactionData[]} transactions
     * @param {Record<string, any>} options
     * @returns {(Interfaces.IBlock | undefined)}
     * @memberof BIP39
     */
    public forge(
        transactions: TransactionInterfaces.ITransactionData[],
        options: Record<string, any>,
    ): Interfaces.IBlock {
        return this.createBlock(this.keys, transactions, options);
    }
}
