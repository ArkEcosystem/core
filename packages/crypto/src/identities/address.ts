import { Address as BaseAddress } from "@arkecosystem/crypto-identities";

import { IMultiSignatureAsset } from "../interfaces";
import { configManager } from "../managers";
import { NetworkType } from "../types";

export class Address {
    public static fromPassphrase(passphrase: string, networkVersion?: number): string {
        if (!networkVersion) {
            networkVersion = configManager.get("network.pubKeyHash");
        }

        return BaseAddress.fromPassphrase(passphrase, { pubKeyHash: (networkVersion as unknown) as number });
    }

    public static fromPublicKey(publicKey: string, networkVersion?: number): string {
        if (!networkVersion) {
            networkVersion = configManager.get("network.pubKeyHash");
        }

        return BaseAddress.fromPublicKey(publicKey, { pubKeyHash: (networkVersion as unknown) as number });
    }

    public static fromWIF(wif: string, network?: NetworkType): string {
        if (!network) {
            network = configManager.get("network.wif");
        }

        return BaseAddress.fromWIF(wif, {
            pubKeyHash: (configManager.get("network.pubKeyHash") as unknown) as number,
            wif: (network as unknown) as number,
        });
    }

    public static fromMultiSignatureAsset(asset: IMultiSignatureAsset, networkVersion?: number): string {
        if (!networkVersion) {
            networkVersion = configManager.get("network.pubKeyHash");
        }

        return BaseAddress.fromMultiSignatureAsset(asset, { pubKeyHash: (networkVersion as unknown) as number });
    }

    public static fromPrivateKey(privateKey, networkVersion?: number): string {
        if (!networkVersion) {
            networkVersion = configManager.get("network.pubKeyHash");
        }

        return BaseAddress.fromPrivateKey(privateKey, { pubKeyHash: (networkVersion as unknown) as number });
    }

    public static fromBuffer(buffer: Buffer): string {
        return BaseAddress.fromBuffer(buffer);
    }

    public static toBuffer(address: string): { addressBuffer: Buffer; addressError?: string } {
        return BaseAddress.toBuffer(address, {
            pubKeyHash: (configManager.get("network.pubKeyHash") as unknown) as number,
        });
    }

    public static validate(address: string, networkVersion?: number): boolean {
        if (!networkVersion) {
            networkVersion = configManager.get("network.pubKeyHash");
        }

        return BaseAddress.validate(address, { pubKeyHash: (networkVersion as unknown) as number });
    }
}
