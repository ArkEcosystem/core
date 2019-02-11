import { bip38, configManager, crypto } from "@arkecosystem/crypto";
import wif from "wif";

export const decryptWIF = (encryptedWif, userId, bip38password) => {
    const decrypted = bip38.decrypt(encryptedWif.toString("hex"), bip38password + userId);

    const encodedWIF = wif.encode(configManager.get("wif"), decrypted.privateKey, decrypted.compressed);

    return { keys: crypto.getKeysFromWIF(encodedWIF), wif: encodedWIF };
};
