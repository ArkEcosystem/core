import { Crypto } from "@arkecosystem/crypto";
import Boom from "boom";
import Joi from "joi";
import { database } from "../../services/database";
import { network } from "../../services/network";

export const transactionBroadcast = {
    name: "transactions.broadcast",
    async method(params) {
        const transaction = await database.get(params.id);

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
