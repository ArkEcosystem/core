import Joi from "@hapi/joi";

export const conditions: string[] = [
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

export const show: object = {
    params: {
        id: Joi.string().required(),
    },
};

export const store: object = {
    payload: {
        event: Joi.string().required(),
        target: Joi.string()
            .uri()
            .required(),
        enabled: Joi.boolean().default(true),
        conditions: Joi.array().items(
            Joi.object({
                key: Joi.string().required(),
                value: Joi.any(),
                condition: Joi.string().valid(conditions).required(),
            }),
        ).required(),
    },
};

export const update: object = {
    params: {
        id: Joi.string().required(),
    },
    payload: {
        event: Joi.string().required(),
        target: Joi.string().uri().required(),
        enabled: Joi.boolean().required(),
        conditions: Joi.array().items(
            Joi.object({
                key: Joi.string().required(),
                value: Joi.any(),
                condition: Joi.string().valid(conditions).required(),
            }),
        ).required(),
    },
};

export const destroy: object = {
    params: {
        id: Joi.string().required(),
    },
};
