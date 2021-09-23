"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bip32_1 = require("bip32");
const bip39_1 = require("bip39");
const managers_1 = require("../managers");
class HDWallet {
    /**
     * Get root node from the given mnemonic with an optional passphrase.
     */
    static fromMnemonic(mnemonic, passphrase) {
        return bip32_1.fromSeed(bip39_1.mnemonicToSeedSync(mnemonic, passphrase), managers_1.configManager.get("network"));
    }
    /**
     * Get bip32 node from keys.
     */
    static fromKeys(keys, chainCode) {
        if (!keys.compressed) {
            throw new TypeError("BIP32 only allows compressed keys.");
        }
        return bip32_1.fromPrivateKey(Buffer.from(keys.privateKey, "hex"), chainCode, managers_1.configManager.get("network"));
    }
    /**
     * Get key pair from the given node.
     */
    static getKeys(node) {
        return {
            publicKey: node.publicKey.toString("hex"),
            privateKey: node.privateKey.toString("hex"),
            compressed: true,
        };
    }
    /**
     * Derives a node from the coin type as specified by slip44.
     */
    static deriveSlip44(root, hardened = true) {
        return root.derivePath(`m/44'/${this.slip44}${hardened ? "'" : ""}`);
    }
    /**
     * Derives a node from the network as specified by AIP20.
     */
    static deriveNetwork(root) {
        return this.deriveSlip44(root).deriveHardened(managers_1.configManager.get("network.aip20") || 1);
    }
}
exports.HDWallet = HDWallet;
HDWallet.slip44 = 111;
//# sourceMappingURL=hdwallet.js.map