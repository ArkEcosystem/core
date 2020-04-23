import { IKeyPair } from "../interfaces";
import { Network } from "../interfaces";
import { BIP32Interface, Libraries } from "./interfaces";

export class HDWallet {
    public readonly slip44 = 111;
    private bip32: any;
    private bip39: any;

    public constructor(libraries: Libraries, private network: Network) {
        this.bip32 = libraries.bip32;
        this.bip39 = libraries.bip39;
    }

    /**
     * Get root node from the given mnemonic with an optional passphrase.
     */
    public fromMnemonic(mnemonic: string, passphrase?: string): BIP32Interface {
        return this.bip32.fromSeed(this.bip39.mnemonicToSeedSync(mnemonic, passphrase), this.network);
    }

    /**
     * Get bip32 node from keys.
     */
    public fromKeys(keys: IKeyPair, chainCode: Buffer): BIP32Interface {
        if (!keys.compressed) {
            throw new TypeError("BIP32 only allows compressed keys.");
        }

        return this.bip32.fromPrivateKey(Buffer.from(keys.privateKey, "hex"), chainCode, this.network);
    }

    /**
     * Get key pair from the given node.
     */
    public getKeys(node: BIP32Interface): IKeyPair {
        if (!node.privateKey) {
            throw new Error();
        }

        return {
            publicKey: node.publicKey.toString("hex"),
            privateKey: node.privateKey.toString("hex"),
            compressed: true,
        };
    }

    /**
     * Derives a node from the coin type as specified by slip44.
     */
    public deriveSlip44(root: BIP32Interface, hardened = true): BIP32Interface {
        return root.derivePath(`m/44'/${this.slip44}${hardened ? "'" : ""}`);
    }

    /**
     * Derives a node from the network as specified by AIP20.
     */
    public deriveNetwork(root: BIP32Interface): BIP32Interface {
        return this.deriveSlip44(root).deriveHardened(this.network.aip20 || 1);
    }
}
