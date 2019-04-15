import { Crypto, Interfaces, Managers } from "@arkecosystem/crypto";
import wif from "wif";
import { database } from "./services/database";

export async function getBIP38Wallet(userId, bip38password): Promise<{ keys: Interfaces.IKeyPair; wif: string }> {
    try {
        const encryptedWif: string = await database.get(
            Crypto.HashAlgorithms.sha256(Buffer.from(userId)).toString("hex"),
        );

        if (!encryptedWif) {
            throw Error("Could not find a matching WIF");
        }

        return decryptWIF(encryptedWif, userId, bip38password);
    } catch (error) {
        throw Error("Could not find a matching WIF");
    }
}

export function decryptWIF(encryptedWif, userId, bip38password): { keys: Interfaces.IKeyPair; wif: string } {
    const decrypted: Interfaces.IDecryptResult = Crypto.bip38.decrypt(
        encryptedWif.toString("hex"),
        bip38password + userId,
    );

    const encodedWIF: string = wif.encode(
        Managers.configManager.get("network.wif"),
        decrypted.privateKey,
        decrypted.compressed,
    );

    return { keys: Crypto.crypto.getKeysFromWIF(encodedWIF), wif: encodedWIF };
}
