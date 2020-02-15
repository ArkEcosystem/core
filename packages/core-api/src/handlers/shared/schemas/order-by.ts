import Joi from "@hapi/joi";

const customJoi = Joi.extend(joi => ({
    base: joi.any(),
    name: "orderBy",
    language: {
        format: "needs to match format <iteratee>:<direction>",
        iteratee: "needs to have an iteratee included in: [{{valid}}]",
        direction: 'needs to have a direction of either "asc" or "desc"',
    },
    rules: [
        {
            name: "valid",
            params: {
                validIteratees: joi
                    .array()
                    .min(1)
                    .items(Joi.string())
                    .required(),
            },
            validate(params, value, state, options) {
                const orderBy = value.split(":");

                if (orderBy.length !== 2) {
                    return this.createError("orderBy.format", { v: value }, state, options);
                }

                const [iteratee, direction] = orderBy;

                if (!["asc", "desc"].includes(direction)) {
                    return this.createError("orderBy.direction", { v: value }, state, options);
                }

                if (!params.validIteratees.includes(iteratee)) {
                    return this.createError(
                        "orderBy.iteratee",
                        { v: value, valid: params.validIteratees.join(", ") },
                        state,
                        options,
                    );
                }

                return value;
            },
        },
    ],
}));

export const orderBy = validIteratees => customJoi.orderBy().valid(validIteratees);
