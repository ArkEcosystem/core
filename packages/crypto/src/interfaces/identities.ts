export interface IKeyPair {
    publicKey: string;
    privateKey: string;
    compressed: boolean;
}

export interface IMultiSignatureAsset {
    min: number;
    publicKeys: string[];
}
