// TODO: move this out and organise properly

export interface Secp256k1 {
    sign: any;
    verify: any;
    signatureExport: any;
    signatureImport: any;
    schnorrVerify: any;
    schnorrSign: any;
}

// TODO:
// Interface taken from Bip32 library, do we need all these?
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

export interface Bip32 {
    fromSeed: any;
    fromPrivateKey: any;
}

export interface Bip39 {
    mnemonicToSeedSync: any;
}

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
    BigNumber;
}
