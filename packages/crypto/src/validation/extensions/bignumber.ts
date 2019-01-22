import BigNumber from "bignumber.js";

export const bignumber = joi => ({
    name: "bignumber",
    base: joi.object().type(BigNumber),
    language: {
        min: "is lower than minimum",
        only: "is different from allowed value",
    },
    rules: [
        {
            name: "min",
            params: {
                q: joi.number().required(),
            },
            validate(params, value, state, options) {
                if (value.isLessThan(params.q)) {
                    return this.createError("bignumber.min", { v: value }, state, options);
                }

                return value;
            },
        },
        {
            name: "only",
            params: {
                q: joi.number().required(),
            },
            validate(params, value, state, options) {
                if (!value.isEqualTo(params.q)) {
                    return this.createError("bignumber.only", { v: value }, state, options);
                }

                return value;
            },
        },
        {
            name: "integer",
            params: {},
            validate(params, value, state, options) {
                if (!value.isInteger()) {
                    return this.createError("bignumber.integer", { v: value }, state, options);
                }

                return value;
            },
        },
        {
            name: "positive",
            params: {},
            validate(params, value, state, options) {
                if (!value.isPositive() || value.isZero()) {
                    return this.createError("bignumber.positive", { v: value }, state, options);
                }

                return value;
            },
        },
    ],
});
