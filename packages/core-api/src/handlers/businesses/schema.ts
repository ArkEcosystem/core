import Joi from "@hapi/joi";
import { bridgechainIteratees, businessIteratees } from "../shared/iteratees";
import { address, genericName, orderBy, pagination, publicKey, walletId } from "../shared/schemas";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(businessIteratees),
            publicKey,
            isResigned: Joi.bool(),
            transform: Joi.bool().default(true),
        },
    },
};

export const show: object = {
    params: {
        id: walletId,
    },
    query: {
        transform: Joi.bool().default(true),
    },
};

export const bridgechains: object = {
    params: {
        id: walletId,
    },
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(bridgechainIteratees),
            isResigned: Joi.bool(),
        },
    },
};

export const bridgechain: object = {
    params: {
        businessId: walletId,
        bridgechainId: Joi.string()
            .hex()
            .length(64), // genesisHash
    },
};

export const search: object = {
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(businessIteratees),
        },
    },
    payload: {
        address,
        publicKey,
        name: genericName,
        website: Joi.string().max(80),
        vat: Joi.string()
            .alphanum()
            .max(15),
        repository: Joi.string().max(80),
        isResigned: Joi.bool(),
        transform: Joi.bool().default(true),
    },
};
