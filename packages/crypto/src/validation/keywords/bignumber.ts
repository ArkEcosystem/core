import { Ajv } from "ajv";
import ajvKeywords from "ajv-keywords";
import { Bignum } from "../../utils";

export const bignumber = (ajv: Ajv) => {
    const instanceOf = ajvKeywords.get("instanceof").definition;
    instanceOf.CONSTRUCTORS.Bignum = Bignum;

    ajv.addKeyword("bignumber", {
        type: ["string"],
        compile(schema) {
            const validateCoerced = ajv.compile(schema);
            return (data, dataPath, parentObject, property) => {
                const minimum = typeof schema.minimum !== "undefined" ? schema.minimum : 0;
                const maximum = typeof schema.maximum !== "undefined" ? schema.maximum : Number.MAX_SAFE_INTEGER;

                const bignum = new Bignum(data);

                if (!bignum.isInteger()) {
                    return false;
                }

                if (bignum.isLessThan(minimum)) {
                    return false;
                }

                if (bignum.isGreaterThan(maximum)) {
                    return false;
                }

                parentObject[property] = bignum;
                return validateCoerced(data);
            };
        },
        errors: true,
        metaSchema: {
            type: "object",
            properties: {
                minimum: { type: "integer" },
                maximum: { type: "integer" },
            },
            additionalItems: false,
        },
    });
};
