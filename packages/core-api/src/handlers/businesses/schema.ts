import Joi from "@hapi/joi";
import { orderBy, pagination } from "../shared/schemas";

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
        publicKey: Joi.string()
            .hex()
            .length(66),
        name: Joi.string()
            .regex(/^[a-zA-Z0-9_-]+$/)
            .max(40),
        website: Joi.string().max(80),
        vat: Joi.string()
            .alphanum()
            .max(15),
        repository: Joi.string().max(80),
        isResigned: Joi.bool(),
    },
};
