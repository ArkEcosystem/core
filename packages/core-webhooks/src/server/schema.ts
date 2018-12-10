import Joi from "joi";

const conditions = [
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

const index = {
    query: {
        page: Joi.number()
            .integer()
            .positive(),
        limit: Joi.number()
            .integer()
            .positive(),
    },
};

const show = {
    params: {
        id: Joi.string(),
    },
};

const store = {
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

const update = {
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

const destroy = {
    params: {
        id: Joi.string(),
    },
};

export { index, show, store, update, destroy };
