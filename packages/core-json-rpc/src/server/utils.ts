import { Crypto, Interfaces, Managers, Validation } from "@arkecosystem/crypto";
import wif from "wif";
import { IWallet } from "../interfaces";
import { database } from "./services/database";

export async function getBIP38Wallet(userId, bip38password): Promise<IWallet> {
    try {
        const encryptedWif: string = await database.get(
            Crypto.HashAlgorithms.sha256(Buffer.from(userId)).toString("hex"),
        );

        return encryptedWif ? decryptWIF(encryptedWif, userId, bip38password) : undefined;
    } catch (error) {
        throw new Error("Could not find a matching WIF");
    }
}

export function decryptWIF(encryptedWif, userId, bip38password): IWallet {
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

export function validateJSON(data, schema) {
    return Validation.Validator.make({ useDefaults: true }).validate(schema, data);
}
