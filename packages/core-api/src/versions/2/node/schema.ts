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
