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

export const bridgechains: object = {
    params: {
        id: Joi.number()
            .integer()
            .min(1),
    },
    query: {
        ...pagination,
        ...{
            orderBy,
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
        businessId: Joi.number()
            .integer()
            .min(1),
        name: Joi.string()
            .regex(/^[a-zA-Z0-9_-]+$/)
            .max(40),
        website: Joi.string().max(80),
        vat: Joi.string()
            .alphanum()
            .max(15),
        repository: Joi.string().max(80),
    },
};
