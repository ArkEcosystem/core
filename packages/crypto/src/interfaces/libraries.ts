import { BigNumberLibrary } from "../types";

export interface BIP32Interface {
    chainCode: Buffer;
    // network: Network; (different Network, as specified in bip32 library)
    lowR: boolean;
    depth: number;
    index: number;
    parentFingerprint: number;
    publicKey: Buffer;
    privateKey?: Buffer;
    identifier: Buffer;
    fingerprint: Buffer;
    isNeutered(): boolean;
    neutered(): BIP32Interface;
    toBase58(): string;
    toWIF(): string;
    derive(index: number): BIP32Interface;
    deriveHardened(index: number): BIP32Interface;
    derivePath(path: string): BIP32Interface;
    sign(hash: Buffer, lowR?: boolean): Buffer;
    verify(hash: Buffer, signature: Buffer): boolean;
}

// TODO: write interfaces for each of these
export interface Libraries {
    scryptSync;
    dayjs;
    aes;
    xor;
    base58;
    wif;
    secp256k1;
    Hash160;
    Hash256;
    RIPEMD160;
    SHA1;
    SHA256;
    bip32: {
        fromPrivateKey;
        fromSeed;
    };
    bip39: {
        mnemonicToSeedSync;
    };
    BigNumber: BigNumberLibrary;
}
