import bs58check from "bs58check";
import { HashAlgorithms } from "../crypto";
import { configManager } from "../managers";
import { PublicKey } from "./public-key";

export class Address {
    public static fromPassphrase(passphrase, networkVersion?: any) {
        return Address.fromPublicKey(PublicKey.fromPassphrase(passphrase), networkVersion);
    }

    public static fromPublicKey(publicKey, networkVersion?: any) {
        const pubKeyRegex = /^[0-9A-Fa-f]{66}$/;
        if (!pubKeyRegex.test(publicKey)) {
            throw new Error(`publicKey '${publicKey}' is invalid`);
        }

        if (!networkVersion) {
            networkVersion = configManager.get("pubKeyHash");
        }

        const buffer = HashAlgorithms.ripemd160(Buffer.from(publicKey, "hex"));
        const payload = Buffer.alloc(21);

        payload.writeUInt8(networkVersion, 0);
        buffer.copy(payload, 1);

        return bs58check.encode(payload);
    }

    public static fromPrivateKey(privateKey, networkVersion?: any) {
        return Address.fromPublicKey(privateKey.publicKey, networkVersion);
    }

    public static validate(address, networkVersion?: any) {
        if (!networkVersion) {
            networkVersion = configManager.get("pubKeyHash");
        }

        try {
            const decode = bs58check.decode(address);
            return decode[0] === networkVersion;
        } catch (e) {
            return false;
        }
    }
}
