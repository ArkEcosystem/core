import { Crypto, Managers } from "@arkecosystem/crypto";
import wif from "wif";

export const decryptWIF = (encryptedWif, userId, bip38password) => {
    const decrypted = Crypto.bip38.decrypt(encryptedWif.toString("hex"), bip38password + userId);

    const encodedWIF = wif.encode(Managers.configManager.get("wif"), decrypted.privateKey, decrypted.compressed);

    return { keys: Crypto.crypto.getKeysFromWIF(encodedWIF), wif: encodedWIF };
};
