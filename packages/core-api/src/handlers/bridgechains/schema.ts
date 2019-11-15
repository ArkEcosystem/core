import Joi from "@hapi/joi";
import { orderBy, pagination } from "../shared/schemas";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy,
            businessId: Joi.number()
                .integer()
                .min(1),
            bridgechainId: Joi.string()
                .hex()
                .length(64),
        },
    },
};

export const show: object = {
    params: {
        id: Joi.string()
            .hex()
            .length(64),
    },
};

export const search: object = {
    query: {
        ...pagination,
        ...{
            orderBy,
        },
    },
    payload: {
        bridgechainId: Joi.string()
            .hex()
            .length(64),
        bridgechainRepository: Joi.string().max(80),
        businessId: Joi.number()
            .integer()
            .min(1),
        genesisHash: Joi.string()
            .hex()
            .length(64),
        name: Joi.string()
            .regex(/^[a-zA-Z0-9_-]+$/)
            .max(40),
        seedNodes: Joi.array()
            .unique()
            .min(1)
            .max(10)
            .items(Joi.string().ip()),
    },
};
