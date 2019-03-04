import Joi from "joi";

export const conditions = [
    "between",
    "contains",
    "eq",
    "falsy",
    "gt",
    "gte",
    "lt",
    "lte",
    "ne",
    "not-between",
    "regexp",
    "truthy",
];

export const index = {
    query: {
        page: Joi.number()
            .integer()
            .positive(),
        limit: Joi.number()
            .integer()
            .positive(),
    },
};

export const show = {
    params: {
        id: Joi.string(),
    },
};

export const store = {
    payload: {
        event: Joi.string().required(),
        target: Joi.string()
            .required()
            .uri(),
        enabled: Joi.boolean().default(true),
        conditions: Joi.array().items(
            Joi.object({
                key: Joi.string(),
                value: Joi.any(),
                condition: Joi.string().valid(conditions),
            }),
        ),
    },
};

export const update = {
    params: {
        id: Joi.string(),
    },
    payload: {
        event: Joi.string(),
        target: Joi.string().uri(),
        enabled: Joi.boolean(),
        conditions: Joi.array().items(
            Joi.object({
                key: Joi.string(),
                value: Joi.any(),
                condition: Joi.string().valid(conditions),
            }),
        ),
    },
};

export const destroy = {
    params: {
        id: Joi.string(),
    },
};
