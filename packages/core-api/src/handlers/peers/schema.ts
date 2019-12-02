import Joi from "@hapi/joi";
import { orderBy, pagination } from "../shared/schemas";

const iteratees = ["latency", "version"];

export const index: object = {
    query: {
        ...pagination,
        ...{
            ip: Joi.string().ip(),
            version: Joi.string(),
            orderBy: orderBy(iteratees),
        },
    },
};

export const show: object = {
    params: {
        ip: Joi.string().ip(),
    },
};
