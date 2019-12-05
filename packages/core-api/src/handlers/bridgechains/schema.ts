import Joi from "@hapi/joi";
import { address, genericName, orderBy, pagination, publicKey } from "../shared/schemas";

const iteratees = ["name"];

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(iteratees),
            publicKey,
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
            orderBy: orderBy(iteratees),
        },
    },
    payload: {
        address,
        publicKey,
        bridgechainRepository: Joi.string().max(80),
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
