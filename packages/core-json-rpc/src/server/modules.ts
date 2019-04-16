import { Crypto, Interfaces, Transactions } from "@arkecosystem/crypto";
import { ITransactionData } from "@arkecosystem/crypto/dist/interfaces";
import { generateMnemonic } from "bip39";
import Boom from "boom";
import Joi from "joi";
import { IWallet } from "../interfaces";
import { database } from "./services/database";
import { network } from "./services/network";
import { decryptWIF, getBIP38Wallet } from "./utils";

export const blocks = [
    {
        name: "blocks.info",
        async method(params) {
            const response = await network.sendRequest({ url: `blocks/${params.id}` });

            if (!response) {
                return Boom.notFound(`Block ${params.id} could not be found.`);
            }

            return response.data;
        },
        schema: {
            id: Joi.number()
                // @ts-ignore
                .unsafe()
                .required(),
        },
    },
    {
        name: "blocks.latest",
        async method() {
            const response = await network.sendRequest({
                url: "blocks",
                query: { orderBy: "height:desc", limit: 1 },
            });

            return response ? response.data[0] : Boom.notFound(`Latest block could not be found.`);
        },
    },
    {
        name: "blocks.transactions",
        async method(params) {
            const response = await network.sendRequest({
                url: `blocks/${params.id}/transactions`,
                query: {
                    offset: params.offset,
                    orderBy: "timestamp:desc",
                },
            });

            if (!response) {
                return Boom.notFound(`Block ${params.id} could not be found.`);
            }

            return {
                count: response.meta.totalCount,
                data: response.data,
            };
        },
        schema: {
            id: Joi.number()
                // @ts-ignore
                .unsafe()
                .required(),
            offset: Joi.number().default(0),
        },
    },
];

export const transactions = [
    {
        name: "transactions.broadcast",
        async method(params) {
            const transaction: ITransactionData = await database.get<ITransactionData>(params.id);

            if (!transaction) {
                return Boom.notFound(`Transaction ${params.id} could not be found.`);
            }

            if (!Crypto.crypto.verify(transaction)) {
                return Boom.badData();
            }

            await network.broadcast(transaction);

            return transaction;
        },
        schema: {
            id: Joi.string().length(64),
        },
    },
    {
        name: "transactions.create",
        async method(params) {
            const transactionBuilder = Transactions.BuilderFactory.transfer()
                .recipientId(params.recipientId)
                .amount(params.amount);

            if (params.vendorField) {
                transactionBuilder.vendorField(params.vendorField);
            }

            const transaction: Interfaces.ITransactionData = transactionBuilder.sign(params.passphrase).getStruct();

            await database.set(transaction.id, transaction);

            return transaction;
        },
        schema: {
            amount: Joi.number().required(),
            recipientId: Joi.string().required(),
            passphrase: Joi.string().required(),
            vendorField: Joi.string(),
        },
    },
    {
        name: "transactions.info",
        async method(params) {
            const response = await network.sendRequest({ url: `transactions/${params.id}` });

            if (!response) {
                return Boom.notFound(`Transaction ${params.id} could not be found.`);
            }

            return response.data;
        },
        schema: {
            id: Joi.string()
                .length(64)
                .required(),
        },
    },
    {
        name: "transactions.bip38.create",
        async method(params) {
            const wallet: IWallet = await getBIP38Wallet(params.userId, params.bip38);

            if (!wallet) {
                return Boom.notFound(`User ${params.userId} could not be found.`);
            }

            const transactionBuilder = Transactions.BuilderFactory.transfer()
                .recipientId(params.recipientId)
                .amount(params.amount);

            if (params.vendorField) {
                transactionBuilder.vendorField(params.vendorField);
            }

            const transaction: Interfaces.ITransactionData = transactionBuilder.signWithWif(wallet.wif).getStruct();

            await database.set(transaction.id, transaction);

            return transaction;
        },
        schema: {
            amount: Joi.number().required(),
            recipientId: Joi.string()
                .length(34)
                .required(),
            vendorField: Joi.string(),
            bip38: Joi.string().required(),
            userId: Joi.string()
                .hex()
                .required(),
        },
    },
];

export const wallets = [
    {
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
    },
    {
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
    },
    {
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
    },
    {
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

                await database.set(
                    Crypto.HashAlgorithms.sha256(Buffer.from(params.userId)).toString("hex"),
                    encryptedWIF,
                );

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
    },
    {
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
    },
];
