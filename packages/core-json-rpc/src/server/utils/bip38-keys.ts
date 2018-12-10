import { configManager, crypto, HashAlgorithms } from "@arkecosystem/crypto";
import bip38 from "bip38";
import wif from "wif";
import { database } from "../services/database";
import { decryptWIF } from "./decrypt-wif";

export async function getBIP38Wallet(userId, bip38password): Promise<any> {
    try {
        const encryptedWif = await database.get(HashAlgorithms.sha256(Buffer.from(userId)).toString("hex"));

        if (encryptedWif) {
            return decryptWIF(encryptedWif, userId, bip38password);
        }
    } catch (error) {
        throw Error("Could not find a matching WIF");

        return false;
    }
}
