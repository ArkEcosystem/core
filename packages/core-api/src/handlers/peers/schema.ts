import Joi from "@hapi/joi";
import { peerIteratees } from "../shared/iteratees";
import { orderBy, pagination } from "../shared/schemas";

export const index: object = {
    query: {
        ...pagination,
        ...{
            ip: Joi.string().ip(),
            version: Joi.string(),
            orderBy: orderBy(peerIteratees),
        },
    },
};

export const show: object = {
    params: {
        ip: Joi.string().ip(),
    },
};
