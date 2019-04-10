import joi from "joi";

export const fees: object = {
    query: {
        days: joi
            .number()
            .integer()
            .min(1)
            .default(7),
    },
};
