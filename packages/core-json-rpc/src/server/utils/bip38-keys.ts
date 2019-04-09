import { Crypto } from "@arkecosystem/crypto";
import { database } from "../services/database";
import { decryptWIF } from "./decrypt-wif";

export async function getBIP38Wallet(userId, bip38password): Promise<any> {
    try {
        const encryptedWif = await database.get(Crypto.HashAlgorithms.sha256(Buffer.from(userId)).toString("hex"));

        if (encryptedWif) {
            return decryptWIF(encryptedWif, userId, bip38password);
        }
    } catch (error) {
        throw Error("Could not find a matching WIF");
        // TODO: Unreachable code. What was the intention here? To have it return a boolean or throw an Error?
        return false;
    }
}
