import * as Joi from "joi";
import { pagination } from "../shared/schemas/pagination";

export const index: object = {
    query: {
        ...pagination,
        ...{
            ip: Joi.string().ip(),
            os: Joi.string(),
            status: Joi.string(),
            port: Joi.number().port(),
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
