import Joi from "@hapi/joi";
import { pagination } from "../shared/schemas/pagination";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: Joi.string(),
            businessId: Joi.number()
                .integer()
                .min(1),
            bridgechainId: Joi.number()
                .integer()
                .min(1),
        },
    },
};

export const show: object = {
    params: {
        id: Joi.number()
            .integer()
            .min(1),
    },
};

export const search: object = {
    query: {
        ...pagination,
        ...{
            orderBy: Joi.string(),
        },
    },
    payload: {
        bridgechainId: Joi.number()
            .integer()
            .min(1),
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
