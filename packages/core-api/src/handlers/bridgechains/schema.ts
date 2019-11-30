import Joi from "@hapi/joi";
import { genericName, orderBy, pagination } from "../shared/schemas";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy,
            publicKey: Joi.string()
                .hex()
                .length(66),
            isResigned: Joi.bool(),
        },
    },
};

export const show: object = {
    params: {
        id: Joi.string()
            .hex()
            .length(64), // id is genesisHash
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
        bridgechainRepository: Joi.string().max(80),
        publicKey: Joi.string()
            .hex()
            .length(66),
        genesisHash: Joi.string()
            .hex()
            .length(64),
        name: genericName,
        seedNodes: Joi.array()
            .unique()
            .min(1)
            .max(10)
            .items(Joi.string().ip()),
        isResigned: Joi.bool(),
    },
};
