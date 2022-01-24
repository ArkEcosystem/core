import { Interfaces } from "@arkecosystem/crypto";

export type UseKeysFunction<T> = (keys: Interfaces.IKeyPair) => T;

export interface KeyPairHolder {
    getPublicKey(): string;
    getAddress(): string;

    useKeys<T>(fn: UseKeysFunction<T>): T;
}
