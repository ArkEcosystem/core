import bip32 from "bip32";
import { mnemonicToSeedSync } from "bip39";
import { IKeyPair } from "../interfaces";
import { configManager } from "../managers";

export class HDWallet {
    public static readonly slip44 = 111;

    /**
     * Get root node from the given mnemonic with an optional passphrase.
     */
    public static fromMnemonic(mnemonic: string, passphrase?: string): bip32.BIP32 {
        return bip32.fromSeed(mnemonicToSeedSync(mnemonic, passphrase), configManager.config);
    }

    /**
     * Get bip32 node from keys.
     */
    public static fromKeys(keys: IKeyPair, chainCode: Buffer): bip32.BIP32 {
        if (!keys.compressed) {
            throw new TypeError("BIP32 only allows compressed keys.");
        }

        return bip32.fromPrivateKey(Buffer.from(keys.privateKey, "hex"), chainCode, configManager.config);
    }

    /**
     * Get key pair from the given node.
     */
    public static getKeys(node: bip32.BIP32): IKeyPair {
        return {
            publicKey: node.publicKey.toString("hex"),
            privateKey: node.privateKey.toString("hex"),
            compressed: true,
        };
    }

    /**
     * Derives a node from the coin type as specified by slip44.
     */
    public static deriveSlip44(root: bip32.BIP32, hardened: boolean = true): bip32.BIP32 {
        return root.derivePath(`m/44'/${this.slip44}${hardened ? "'" : ""}`);
    }

    /**
     * Derives a node from the network as specified by AIP20.
     */
    public static deriveNetwork(root: bip32.BIP32): bip32.BIP32 {
        return this.deriveSlip44(root).deriveHardened(configManager.config.aip20 || 1);
    }
}
