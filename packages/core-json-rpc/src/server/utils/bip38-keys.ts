import { configManager, crypto, utils } from "@arkecosystem/crypto";
import bip38 from "bip38";
import wif from "wif";
import { database } from "../services/database";

export async function getBIP38Wallet(userId, bip38password): Promise<any> {
  try {
    const encryptedWif = await database.get(
      utils.sha256(Buffer.from(userId)).toString("hex"),
    );

    if (encryptedWif) {
      const decrypted = bip38.decrypt(
        encryptedWif.toString("hex"),
        bip38password + userId,
      );
      const wifKey = wif.encode(
        configManager.get("wif"),
        decrypted.privateKey,
        decrypted.compressed,
      );
      const keys = crypto.getKeysFromWIF(wifKey);

      return { keys, wif: wifKey };
    }
  } catch (error) {
    throw Error("Could not find a matching WIF");

    return false;
  }
}
