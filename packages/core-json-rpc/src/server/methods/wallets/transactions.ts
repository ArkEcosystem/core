import Boom from "boom";
import Joi from "joi";
import { network } from "../../services/network";

export const walletTransactions = {
    name: "wallets.transactions",
    async method(params) {
        const response = await network.sendGET("transactions", {
            offset: params.offset || 0,
            orderBy: "timestamp:desc",
            ownerId: params.address,
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
