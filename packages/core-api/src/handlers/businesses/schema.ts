import Joi from "@hapi/joi";
import { address, genericName, orderBy, pagination, publicKey } from "../shared/schemas";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy,
            publicKey,
            isResigned: Joi.bool(),
        },
    },
};

export const show: object = {
    params: {
        id: Joi.string()
            .hex()
            .length(66),
    },
};

export const bridgechains: object = {
    params: {
        id: Joi.string()
            .hex()
            .length(66),
    },
    query: {
        ...pagination,
        ...{
            orderBy,
            isResigned: Joi.bool(),
        },
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
        address,
        publicKey,
        name: genericName,
        website: Joi.string().max(80),
        vat: Joi.string()
            .alphanum()
            .max(15),
        repository: Joi.string().max(80),
        isResigned: Joi.bool(),
    },
};
