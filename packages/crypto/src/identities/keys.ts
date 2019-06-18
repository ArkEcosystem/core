import { secp256k1 } from "bcrypto";
import wif from "wif";
import { HashAlgorithms } from "../crypto";
import { NetworkVersionError } from "../errors";
import { IKeyPair } from "../interfaces";
import { INetwork } from "../interfaces/networks";
import { configManager } from "../managers";

export class Keys {
    public static fromPassphrase(passphrase: string, compressed: boolean = true): IKeyPair {
        return Keys.fromPrivateKey(HashAlgorithms.sha256(Buffer.from(passphrase, "utf8")), compressed);
    }

    public static fromPrivateKey(privateKey: Buffer | string, compressed: boolean = true): IKeyPair {
        privateKey = privateKey instanceof Buffer ? privateKey : Buffer.from(privateKey, "hex");

        return {
            publicKey: secp256k1.publicKeyCreate(privateKey, compressed).toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed,
        };
    }

    public static fromWIF(wifKey: string, network?: INetwork): IKeyPair {
        if (!network) {
            network = configManager.get("network");
        }

        const { version, compressed, privateKey } = wif.decode(wifKey, network.wif);

        if (version !== network.wif) {
            throw new NetworkVersionError(network.wif, version);
        }

        return {
            publicKey: secp256k1.publicKeyCreate(privateKey, compressed).toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed,
        };
    }
}
