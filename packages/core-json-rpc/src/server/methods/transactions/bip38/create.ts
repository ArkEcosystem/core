import { Transactions } from "@arkecosystem/crypto";
import Boom from "boom";
import Joi from "joi";
import { database } from "../../../services/database";
import { getBIP38Wallet } from "../../../utils/bip38-keys";

export const transactionBIP38Create = {
    name: "transactions.bip38.create",
    async method(params) {
        const wallet = await getBIP38Wallet(params.userId, params.bip38);

        if (!wallet) {
            return Boom.notFound(`User ${params.userId} could not be found.`);
        }

        const transaction = Transactions.BuilderFactory.transfer()
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
