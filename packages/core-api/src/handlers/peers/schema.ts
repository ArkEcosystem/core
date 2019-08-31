import Joi from "@hapi/joi";

import { pagination } from "../shared/schemas/pagination";

export const index: object = {
    query: {
        ...pagination,
        ...{
            ip: Joi.string().ip(),
            version: Joi.string(),
            orderBy: Joi.string(),
        },
    },
};

export const show: object = {
    params: {
        ip: Joi.string().ip(),
    },
};
