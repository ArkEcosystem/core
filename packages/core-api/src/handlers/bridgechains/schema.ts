import Joi from "@hapi/joi";

import { pagination } from "../shared/schemas/pagination";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: Joi.string(),
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
    },
};
