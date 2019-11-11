import Joi from "@hapi/joi";
import { orderBy, pagination } from "../shared/schemas";

export const index: object = {
    query: {
        ...pagination,
        ...{
            ip: Joi.string().ip(),
            version: Joi.string(),
            orderBy,
        },
    },
};

export const show: object = {
    params: {
        ip: Joi.string().ip(),
    },
};
