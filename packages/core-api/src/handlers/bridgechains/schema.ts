import Joi from "@hapi/joi";
import { bridgechainIteratees } from "../shared/iteratees";
import { address, genericName, orderBy, pagination, publicKey } from "../shared/schemas";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(bridgechainIteratees),
            publicKey,
            isResigned: Joi.bool(),
        },
    },
};

export const search: object = {
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(bridgechainIteratees),
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
