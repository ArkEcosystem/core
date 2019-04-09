import { Crypto } from "@arkecosystem/crypto";
import Joi from "joi";

export const walletCreate = {
    name: "wallets.create",
    async method(params) {
        const { publicKey } = Crypto.crypto.getKeys(params.passphrase);

        return {
            publicKey,
            address: Crypto.crypto.getAddress(publicKey),
        };
    },
    schema: {
        passphrase: Joi.string().required(),
    },
};
