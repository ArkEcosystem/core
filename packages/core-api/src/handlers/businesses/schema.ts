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
            orderBy: Joi.string(),
        },
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
        businessId: Joi.number()
            .integer()
            .min(1),
        name: Joi.string()
            .regex(/^[a-zA-Z0-9_-]+$/)
            .max(40),
        website: Joi.string().max(50),
        vat: Joi.string()
            .alphanum()
            .max(15),
        repository: Joi.string().max(50),
    },
};
