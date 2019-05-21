import Boom from "boom";
import Joi from "joi";
import { network } from "../../services/network";

export const blockTransactions = {
    name: "blocks.transactions",
    async method(params) {
        const response = await network.sendGET(`blocks/${params.id}/transactions`, {
            offset: params.offset,
            orderBy: "timestamp:desc",
        });

        return response
            ? {
                  count: response.meta.totalCount,
                  data: response.data,
              }
            : Boom.notFound(`Block ${params.id} could not be found.`);
    },
    schema: {
        id: Joi.alternatives()
            .try(Joi.number().unsafe(), Joi.string().length(64))
            .required(),
        offset: Joi.number().default(0),
    },
};
