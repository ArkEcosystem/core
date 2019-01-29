import BigNumber from "bignumber.js";

export const bignumber = joi => ({
    name: "bignumber",
    base: joi.object().type(BigNumber),
    language: {
        min: "is less than minimum",
        max: "is greater than maximum",
        only: "is different from allowed value",
        integer: "is not an integer",
        positive: "is not positive",
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
            name: "max",
            params: {
                q: joi.number().required(),
            },
            validate(params, value, state, options) {
                if (value.isGreaterThan(params.q)) {
                    return this.createError("bignumber.max", { v: value }, state, options);
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
            validate(_, value, state, options) {
                if (!value.isInteger()) {
                    return this.createError("bignumber.integer", { v: value }, state, options);
                }

                return value;
            },
        },
        {
            name: "positive",
            params: {},
            validate(_, value, state, options) {
                if (!value.isPositive() || value.isZero()) {
                    return this.createError("bignumber.positive", { v: value }, state, options);
                }

                return value;
            },
        },
    ],
});
