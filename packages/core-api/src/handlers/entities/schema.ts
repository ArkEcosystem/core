import Joi from "@hapi/joi";
import { entityIteratees } from "../shared/iteratees";
import { orderBy, pagination } from "../shared/schemas";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(entityIteratees),
            publicKey: Joi.string()
                .hex()
                .length(66),
            type: Joi.number().integer(), // see enum in core-magistrate-crypto
            subType: Joi.number().integer(), // see enum in core-magistrate-crypto
            name: Joi.string()
                .regex(/^[a-zA-Z0-9_-]+$/)
                .max(40),
            isResigned: Joi.bool(),
        },
    },
};

export const show: object = {
    params: Joi.object({
        id: Joi.string()
            .hex()
            .length(64), // id is registration tx id
    }),
};

export const search: object = {
    query: Joi.object({
        ...pagination,
        ...{
            orderBy: orderBy(entityIteratees),
        },
    }),
    payload: Joi.object({
        publicKey: Joi.string()
            .hex()
            .length(66),
        type: Joi.number().integer(), // see enum in core-magistrate-crypto
        subType: Joi.number().integer(), // see enum in core-magistrate-crypto
        name: Joi.string()
            .regex(/^[a-zA-Z0-9_-]+$/)
            .max(40),
        isResigned: Joi.bool(),
    }),
};
