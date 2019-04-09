import { Crypto } from "@arkecosystem/crypto";
import Boom from "boom";
import Joi from "joi";
import { database } from "../../../services/database";
import { decryptWIF } from "../../../utils/decrypt-wif";

export const walletBIP38 = {
    name: "wallets.bip38.info",
    async method(params) {
        const encryptedWIF = await database.get(
            Crypto.HashAlgorithms.sha256(Buffer.from(params.userId)).toString("hex"),
        );

        if (!encryptedWIF) {
            return Boom.notFound(`User ${params.userId} could not be found.`);
        }

        const { keys, wif } = decryptWIF(encryptedWIF, params.userId, params.bip38);

        return {
            publicKey: keys.publicKey,
            address: Crypto.crypto.getAddress(keys.publicKey),
            wif,
        };
    },
    schema: {
        bip38: Joi.string().required(),
        userId: Joi.string()
            .hex()
            .required(),
    },
};
