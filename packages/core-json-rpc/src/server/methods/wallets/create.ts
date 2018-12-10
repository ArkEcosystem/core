import { crypto } from "@arkecosystem/crypto";
import Joi from "joi";

export const walletCreate = {
    name: "wallets.create",
    async method(params) {
        const { publicKey } = crypto.getKeys(params.passphrase);

        return {
            publicKey,
            address: crypto.getAddress(publicKey),
        };
    },
    schema: {
        passphrase: Joi.string().required(),
    },
};
