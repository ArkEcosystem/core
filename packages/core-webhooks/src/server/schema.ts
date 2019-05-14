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
        id: Joi.string(),
    },
};

export const store: object = {
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

export const update: object = {
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

export const destroy: object = {
    params: {
        id: Joi.string(),
    },
};
