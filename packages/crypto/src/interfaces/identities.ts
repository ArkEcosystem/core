export interface IKeyPair {
    publicKey: string;
    privateKey: string;
    compressed: boolean;
}

export type UseKeysFunction<T> = (keys: IKeyPair) => T;

export interface KeyPairHolder {
    getPublicKey(): string;
    getAddress(): string;

    useKeys<T>(fn: UseKeysFunction<T>): T;
}
