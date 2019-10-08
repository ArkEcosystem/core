// Based on https://github.com/fknop/hapi-pagination

import Joi from "@hapi/joi";

export const getConfig = options => {
    const { error, value } = Joi.validate(
        options,
        Joi.object({
            query: Joi.object({
                limit: Joi.object({
                    default: Joi.number()
                        .integer()
                        .positive()
                        .default(100),
                }),
            }),
        }),
    );

    return { error: error || undefined, config: error ? undefined : value };
};
