import { Transactions } from "@arkecosystem/crypto";
import Joi from "joi";
import { database } from "../../services/database";

export const transactionCreate = {
    name: "transactions.create",
    async method(params) {
        const transaction = Transactions.BuilderFactory.transfer()
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
