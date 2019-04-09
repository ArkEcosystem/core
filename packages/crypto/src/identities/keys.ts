import secp256k1 from "secp256k1";
import wif from "wif";
import { HashAlgorithms } from "../crypto";
import { NetworkVersionError } from "../errors";
import { IKeyPair } from "../interfaces";
import { configManager } from "../managers";

export class Keys {
    public static fromPassphrase(passphrase: string, compressed: boolean = true): IKeyPair {
        const privateKey = HashAlgorithms.sha256(Buffer.from(passphrase, "utf8"));
        return Keys.fromPrivateKey(privateKey, compressed);
    }

    public static fromPrivateKey(privateKey: Buffer | string, compressed: boolean = true): IKeyPair {
        privateKey = privateKey instanceof Buffer ? privateKey : Buffer.from(privateKey, "hex");

        const publicKey = secp256k1.publicKeyCreate(privateKey, compressed);
        const IKeyPair = {
            publicKey: publicKey.toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed,
        };

        return IKeyPair;
    }

    public static fromWIF(wifKey: string, network?: { wif: number }): IKeyPair {
        if (!network) {
            network = configManager.all();
        }

        // @ts-ignore
        const { version, compressed, privateKey } = wif.decode(wifKey);

        if (version !== network.wif) {
            throw new NetworkVersionError(network.wif, version);
        }

        const publicKey = secp256k1.publicKeyCreate(privateKey, compressed);

        const IKeyPair = {
            publicKey: publicKey.toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed,
        };

        return IKeyPair;
    }
}
