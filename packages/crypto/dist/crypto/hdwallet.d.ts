/// <reference types="node" />
import { BIP32Interface } from "bip32";
import { IKeyPair } from "../interfaces";
export declare class HDWallet {
    static readonly slip44 = 111;
    /**
     * Get root node from the given mnemonic with an optional passphrase.
     */
    static fromMnemonic(mnemonic: string, passphrase?: string): BIP32Interface;
    /**
     * Get bip32 node from keys.
     */
    static fromKeys(keys: IKeyPair, chainCode: Buffer): BIP32Interface;
    /**
     * Get key pair from the given node.
     */
    static getKeys(node: BIP32Interface): IKeyPair;
    /**
     * Derives a node from the coin type as specified by slip44.
     */
    static deriveSlip44(root: BIP32Interface, hardened?: boolean): BIP32Interface;
    /**
     * Derives a node from the network as specified by AIP20.
     */
    static deriveNetwork(root: BIP32Interface): BIP32Interface;
}
