import { bip38, crypto, HashAlgorithms } from "@arkecosystem/crypto";
import bip39 from "bip39";
import Joi from "joi";
import { database } from "../../../services/database";
import { getBIP38Wallet } from "../../../utils/bip38-keys";
import { decryptWIF } from "../../../utils/decrypt-wif";

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

            const encryptedWIF = bip38.encrypt(Buffer.from(privateKey, "hex"), true, params.bip38 + params.userId);
            await database.set(HashAlgorithms.sha256(Buffer.from(params.userId)).toString("hex"), encryptedWIF);

            const { wif } = decryptWIF(encryptedWIF, params.userId, params.bip38);

            return {
                publicKey,
                address: crypto.getAddress(publicKey),
                wif,
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
