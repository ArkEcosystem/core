import { Address as Identity } from "@arkecosystem/crypto-identities";

import { IKeyPair, IMultiSignatureAsset, Network } from "../interfaces";
import { getPubKeyHash, getPubKeyHashFromNetwork, getWifFromNetwork } from "./helpers";

export class Address {
    public static fromPassphrase(passphrase: string, networkVersion?: number): string {
        return Identity.fromPassphrase(passphrase, { pubKeyHash: getPubKeyHash(networkVersion) });
    }

    public static fromPublicKey(publicKey: string, networkVersion?: number): string {
        return Identity.fromPublicKey(publicKey, { pubKeyHash: getPubKeyHash(networkVersion) });
    }

    public static fromWIF(wif: string, network?: Network): string {
        return Identity.fromWIF(wif, {
            pubKeyHash: getPubKeyHashFromNetwork(network),
            wif: getWifFromNetwork(network),
        });
    }

    public static fromMultiSignatureAsset(asset: IMultiSignatureAsset, networkVersion?: number): string {
        return Identity.fromMultiSignatureAsset(asset, { pubKeyHash: getPubKeyHash(networkVersion) });
    }

    public static fromPrivateKey(privateKey: IKeyPair, networkVersion?: number): string {
        return Identity.fromPrivateKey(privateKey, { pubKeyHash: getPubKeyHash(networkVersion) });
    }

    public static fromBuffer(buff: Buffer): string {
        return Identity.fromBuffer(buff);
    }

    public static toBuffer(address: string, networkVersion?: number): { addressBuffer: Buffer; addressError?: string } {
        return Identity.toBuffer(address, { pubKeyHash: getPubKeyHash(networkVersion) });
    }

    public static validate(address: string, networkVersion?: number): boolean {
        return Identity.validate(address, { pubKeyHash: getPubKeyHash(networkVersion) });
    }
}
