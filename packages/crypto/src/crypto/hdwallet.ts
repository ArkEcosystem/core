import bip32 from "bip32";
import bip39 from "bip39";
import { configManager } from "../managers/config";

class HDWallet {
    public readonly slip44: number;

    constructor() {
        this.slip44 = 111;
    }

    /**
     * Get root node from the given mnemonic with an optional passphrase.
     * @param {String} mnemonic
     * @param {(String|undefined)} passphrase
     * @returns {bip32}
     */
    public fromMnemonic(mnemonic, passphrase?: any) {
        const seed = bip39.mnemonicToSeed(mnemonic, passphrase);
        return bip32.fromSeed(seed, configManager.config);
    }

    /**
     * Get bip32 node from keys.
     * @param {Object} keys
     * @param {Buffer} chainCode
     * @returns {bip32}
     */
    public fromKeys(keys, chainCode) {
        if (!keys.compressed) {
            throw new TypeError("BIP32 only allows compressed keys.");
        }

        return bip32.fromPrivateKey(Buffer.from(keys.privateKey, "hex"), chainCode, configManager.config);
    }

    /**
     * Get key pair from the given node.
     * @param {bip32} node
     * @return {Object}
     */
    public getKeys(node) {
        return {
            publicKey: node.publicKey.toString("hex"),
            privateKey: node.privateKey.toString("hex"),
            compressed: true,
        };
    }

    /**
     * Derives a node from the coin type as specified by slip44.
     * @param {bip32} root
     * @param {(Boolean|undefined)} hardened
     * @returns {bip32}
     */
    public deriveSlip44(root, hardened = true) {
        return root.derivePath(`m/44'/${this.slip44}${hardened ? "'" : ""}`);
    }

    /**
     * Derives a node from the network as specified by AIP20.
     * @param {bip32} root
     * @returns {bip32}
     */
    public deriveNetwork(root) {
        return this.deriveSlip44(root).deriveHardened(configManager.config.aip20 || 1);
    }
}

const hdWallet = new HDWallet();
export { hdWallet as HDWallet };
