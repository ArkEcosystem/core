import { Crypto, Interfaces } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import Boom from "boom";
import Joi from "joi";
import { IWallet } from "../../interfaces";
import { database } from "../services/database";
import { network } from "../services/network";
import { decryptWIF, getBIP38Wallet } from "../utils";

export const walletCreate = {
    name: "wallets.create",
    async method(params) {
        const { publicKey }: Interfaces.IKeyPair = Crypto.crypto.getKeys(params.passphrase);

        return {
            publicKey,
            address: Crypto.crypto.getAddress(publicKey),
        };
    },
    schema: {
        passphrase: Joi.string().required(),
    },
};

export const walletInfo = {
    name: "wallets.info",
    async method(params) {
        const response = await network.sendRequest({ url: `wallets/${params.address}` });

        if (!response) {
            return Boom.notFound(`Wallet ${params.address} could not be found.`);
        }

        return response.data;
    },
    schema: {
        address: Joi.string()
            .length(34)
            .required(),
    },
};

export const walletTransactions = {
    name: "wallets.transactions",
    async method(params) {
        const response = await network.sendRequest({
            url: "transactions",
            query: {
                offset: params.offset || 0,
                orderBy: "timestamp:desc",
                ownerId: params.address,
            },
        });

        if (!response.data || !response.data.length) {
            return Boom.notFound(`Wallet ${params.address} could not be found.`);
        }

        return {
            count: response.meta.totalCount,
            data: response.data,
        };
    },
    schema: {
        address: Joi.string()
            .length(34)
            .required(),
        offset: Joi.number().default(0),
    },
};

export const walletBIP38Create = {
    name: "wallets.bip38.create",
    async method(params) {
        try {
            const { keys, wif }: IWallet = await getBIP38Wallet(params.userId, params.bip38);

            return {
                publicKey: keys.publicKey,
                address: Crypto.crypto.getAddress(keys.publicKey),
                wif,
            };
        } catch (error) {
            const { publicKey, privateKey }: Interfaces.IKeyPair = Crypto.crypto.getKeys(generateMnemonic());

            const encryptedWIF: string = Crypto.bip38.encrypt(
                Buffer.from(privateKey, "hex"),
                true,
                params.bip38 + params.userId,
            );

            await database.set(Crypto.HashAlgorithms.sha256(Buffer.from(params.userId)).toString("hex"), encryptedWIF);

            return {
                publicKey,
                address: Crypto.crypto.getAddress(publicKey),
                wif: decryptWIF(encryptedWIF, params.userId, params.bip38).wif,
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
