import Boom from "boom";
import Joi from "joi";
import { network } from "../services/network";

export const blockInfo = {
    name: "blocks.info",
    async method(params) {
        const response = await network.sendRequest({ url: `blocks/${params.id}` });

        return response ? response.data : Boom.notFound(`Block ${params.id} could not be found.`);
    },
    schema: {
        id: Joi.number()
            // @ts-ignore
            .unsafe()
            .required(),
    },
};

export const blockLatest = {
    name: "blocks.latest",
    async method() {
        const response = await network.sendRequest({
            url: "blocks",
            query: { orderBy: "height:desc", limit: 1 },
        });

        return response ? response.data[0] : Boom.notFound(`Latest block could not be found.`);
    },
};

export const blockTransactions = {
    name: "blocks.transactions",
    async method(params) {
        const response = await network.sendRequest({
            url: `blocks/${params.id}/transactions`,
            query: {
                offset: params.offset,
                orderBy: "timestamp:desc",
            },
        });

        return response
            ? {
                  count: response.meta.totalCount,
                  data: response.data,
              }
            : Boom.notFound(`Block ${params.id} could not be found.`);
    },
    schema: {
        id: Joi.number()
            // @ts-ignore
            .unsafe()
            .required(),
        offset: Joi.number().default(0),
    },
};
