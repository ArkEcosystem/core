import { BIP32Interface, fromPrivateKey, fromSeed } from "bip32";
import { mnemonicToSeedSync } from "bip39";
import { IKeyPair } from "../interfaces";
import { configManager } from "../managers";

export class HDWallet {
    public static readonly slip44 = 111;

    /**
     * Get root node from the given mnemonic with an optional passphrase.
     */
    public static fromMnemonic(mnemonic: string, passphrase?: string): BIP32Interface {
        return fromSeed(mnemonicToSeedSync(mnemonic, passphrase), configManager.get("network"));
    }

    /**
     * Get bip32 node from keys.
     */
    public static fromKeys(keys: IKeyPair, chainCode: Buffer): BIP32Interface {
        if (!keys.compressed) {
            throw new TypeError("BIP32 only allows compressed keys.");
        }

        return fromPrivateKey(Buffer.from(keys.privateKey, "hex"), chainCode, configManager.get("network"));
    }

    /**
     * Get key pair from the given node.
     */
    public static getKeys(node: BIP32Interface): IKeyPair {
        return {
            publicKey: node.publicKey.toString("hex"),
            privateKey: node.privateKey.toString("hex"),
            compressed: true,
        };
    }

    /**
     * Derives a node from the coin type as specified by slip44.
     */
    public static deriveSlip44(root: BIP32Interface, hardened: boolean = true): BIP32Interface {
        return root.derivePath(`m/44'/${this.slip44}${hardened ? "'" : ""}`);
    }

    /**
     * Derives a node from the network as specified by AIP20.
     */
    public static deriveNetwork(root: BIP32Interface): BIP32Interface {
        return this.deriveSlip44(root).deriveHardened(configManager.get("network.aip20") || 1);
    }
}
