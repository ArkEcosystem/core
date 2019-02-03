import secp256k1 from "secp256k1";
import wif from "wif";

import { HashAlgorithms } from "../crypto";
import { NetworkVersionError } from "../errors";
import { configManager } from "../managers";
import { INetwork } from "../networks";

export interface KeyPair {
    publicKey: string;
    privateKey: string;
    compressed: boolean;
}

export class Keys {
    public static fromPassphrase(passphrase: string, compressed: boolean = true): KeyPair {
        const privateKey = HashAlgorithms.sha256(Buffer.from(passphrase, "utf8"));
        return Keys.fromPrivateKey(privateKey, compressed);
    }

    public static fromPrivateKey(privateKey: Buffer | string, compressed: boolean = true): KeyPair {
        privateKey = privateKey instanceof Buffer ? privateKey : Buffer.from(privateKey, "hex");

        const publicKey = secp256k1.publicKeyCreate(privateKey, compressed);
        const keyPair = {
            publicKey: publicKey.toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed,
        };

        return keyPair;
    }

    public static fromWIF(wifKey: string, network?: { wif: number }): KeyPair {
        if (!network) {
            network = configManager.all();
        }

        // @ts-ignore
        const decoded = wif.decode(wifKey);
        const version = decoded.version;

        if (version !== network.wif) {
            throw new NetworkVersionError(network.wif, version);
        }

        const privateKey = decoded.privateKey;
        const publicKey = secp256k1.publicKeyCreate(privateKey, decoded.compressed);

        const keyPair = {
            publicKey: publicKey.toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed: decoded.compressed,
        };

        return keyPair;
    }
}
