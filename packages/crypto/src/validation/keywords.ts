import { Ajv } from "ajv";
import ajvKeywords from "ajv-keywords";
import { Bignum } from "../utils";

const bignumber = (ajv: Ajv) => {
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
        errors: false,
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

const maxBytes = (ajv: Ajv) => {
    ajv.addKeyword("maxBytes", {
        type: "string",
        compile(schema, parentSchema) {
            return data => {
                if ((parentSchema as any).type !== "string") {
                    return false;
                }

                return Buffer.from(data, "utf8").byteLength <= schema;
            };
        },
        errors: false,
        metaSchema: {
            type: "integer",
            minimum: 0,
        },
    });
};

const transactionType = (ajv: Ajv) => {
    ajv.addKeyword("transactionType", {
        type: "integer",
        compile(schema) {
            return data => {
                return data === schema;
            };
        },
        errors: false,
        metaSchema: {
            type: "integer",
            minimum: 0,
        },
    });
};

export const keywords = [bignumber, maxBytes, transactionType];
