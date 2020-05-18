import { Blocks, CryptoManager } from "@arkecosystem/core-crypto";

import { Delegate } from "./interfaces";
import { BIP38 } from "./methods/bip38";
import { BIP39 } from "./methods/bip39";

/**
 * @export
 * @class DelegateFactory
 */
export class DelegateFactory {
    /**
     * @static
     * @param {string} bip38
     * @param {string} password
     * @returns {Delegate}
     * @memberof DelegateFactory
     */
    public static fromBIP38(
        bip38: string,
        password: string,
        cryptoManager: CryptoManager,
        blockFactory: Blocks.BlockFactory,
    ): Delegate {
        if (!cryptoManager.LibraryManager.Crypto.Bip38.verify(bip38)) {
            throw new Error("not bip38");
        }

        return new BIP38(cryptoManager, blockFactory, bip38, password);
    }

    /**
     * @static
     * @param {string} passphrase
     * @returns {Delegate}
     * @memberof DelegateFactory
     */
    public static fromBIP39(
        passphrase: string,
        cryptoManager: CryptoManager,
        blockFactory: Blocks.BlockFactory,
    ): Delegate {
        if (cryptoManager.LibraryManager.Crypto.Bip38.verify(passphrase)) {
            throw new Error("seems to be bip38");
        }

        return new BIP39(cryptoManager, blockFactory, passphrase);
    }
}
