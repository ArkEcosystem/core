import joi from "@hapi/joi";

export const fees: object = {
    query: {
        days: joi
            .number()
            .integer()
            .min(1)
            .max(30)
            .default(7),
    },
};

export const debug: object = {
    query: {
        lines: joi
            .number()
            .integer()
            .min(1)
            .max(10000)
            .default(1000),
    },
};
