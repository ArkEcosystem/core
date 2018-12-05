import { crypto, utils } from "@arkecosystem/crypto";
import bip38 from "bip38";
import bip39 from "bip39";
import Joi from "joi";
import { database } from "../../../services/database";
import { getBIP38Wallet } from "../../../utils/bip38-keys";

export const walletBIP38Create = {
  name: "wallets.bip38.create",
  async method(params) {
    try {
      const { keys, wif } = await getBIP38Wallet(params.userId, params.bip38);

      return {
        publicKey: keys.publicKey,
        address: crypto.getAddress(keys.publicKey),
        wif,
      };
    } catch (error) {
      const { publicKey, privateKey } = crypto.getKeys(bip39.generateMnemonic());

      const encryptedWif = bip38.encrypt(
        Buffer.from(privateKey, "hex"),
        true,
        params.bip38 + params.userId,
      );
      await database.set(
        utils.sha256(Buffer.from(params.userId)).toString("hex"),
        encryptedWif,
      );

      return {
        publicKey,
        address: crypto.getAddress(publicKey),
        wif: encryptedWif,
      };
    }
  },
  schema: {
    bip38: Joi.string().required(),
    userId: Joi.string()
      .hex()
      .required(),
  },
};
