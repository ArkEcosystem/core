import Boom from "boom";
import Joi from "joi";
import { network } from "../../services/network";

export const transactionInfo = {
    name: "transactions.info",
    async method(params) {
        const response = await network.sendRequest(`transactions/${params.id}`);

        return response ? response.body : Boom.notFound(`Transaction ${params.id} could not be found.`);
    },
    schema: {
        id: Joi.string()
            .length(64)
            .required(),
    },
};
