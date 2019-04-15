import { Crypto, Interfaces, Transactions } from "@arkecosystem/crypto";
import { ITransactionData } from "@arkecosystem/crypto/dist/interfaces";
import Boom from "boom";
import Joi from "joi";
import { IWallet } from "../../interfaces";
import { database } from "../services/database";
import { network } from "../services/network";
import { getBIP38Wallet } from "../utils";

export const transactionBroadcast = {
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
};

export const transactionCreate = {
    name: "transactions.create",
    async method(params) {
        const transaction: Interfaces.ITransactionData = Transactions.BuilderFactory.transfer()
            .recipientId(params.recipientId)
            .amount(params.amount)
            .sign(params.passphrase)
            .getStruct();

        await database.set(transaction.id, transaction);

        return transaction;
    },
    schema: {
        amount: Joi.number().required(),
        recipientId: Joi.string().required(),
        passphrase: Joi.string().required(),
    },
};

export const transactionInfo = {
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
};

export const transactionBIP38Create = {
    name: "transactions.bip38.create",
    async method(params) {
        const wallet: IWallet = await getBIP38Wallet(params.userId, params.bip38);

        if (!wallet) {
            return Boom.notFound(`User ${params.userId} could not be found.`);
        }

        const transaction: Interfaces.ITransactionData = Transactions.BuilderFactory.transfer()
            .recipientId(params.recipientId)
            .amount(params.amount)
            .signWithWif(wallet.wif)
            .getStruct();

        await database.set(transaction.id, transaction);

        return transaction;
    },
    schema: {
        amount: Joi.number().required(),
        recipientId: Joi.string()
            .length(34)
            .required(),
        bip38: Joi.string().required(),
        userId: Joi.string()
            .hex()
            .required(),
    },
};
