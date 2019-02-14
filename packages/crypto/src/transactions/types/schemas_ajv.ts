import Ajv from "ajv";
import ajvKeywords from "ajv-keywords";
import { Bignum } from "../../utils";

const schemas = {
    hex: {
        $id: "hex",
        type: "string",
        pattern: "^[0123456789A-Fa-f]+$",
    },

    base58: {
        $id: "base58",
        type: "string",
        pattern: "^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$",
    },

    numericString: {
        $id: "numericString",
        type: "string",
        pattern: "^[0-9]+$",
    },

    address: {
        $id: "address",
        allOf: [{ $ref: "base58" }, { minLength: 34, maxLength: 34 }],
    },

    blockId: {
        $id: "blockId",
        $ref: "numericString",
    },

    publicKey: {
        $id: "publicKey",
        allOf: [{ $ref: "hex" }, { minLength: 66, maxLength: 66 }, { transform: ["toLowerCase"] }],
    },

    username: {
        $id: "delegateUsername",
        allOf: [
            { type: "string" },
            { pattern: "^[a-z0-9!@$&_.]+$" },
            { minLength: 1, maxLength: 20 },
            { transform: ["toLowerCase"] },
        ],
    },

    bignumber: {
        $id: "bignumber",
        allOf: [
            {
                anyOf: [{ type: "integer", minimum: 0 }, { $ref: "numericString" }, { instanceof: "Bignum" }],
            },
            {
                cast: {
                    to: "bignumber",
                },
            },
        ],
    },

    test: {
        type: "object",
        properties: {
            bla: { type: "string", cast: { to: "bignumber" } },
            publicKey: { $ref: "publicKey" },
            delegate: { $ref: "delegateUsername" },
            amount: { $ref: "bignumber" },
        },
    },
};

const ajv = new Ajv({ $data: true, schemas });
ajvKeywords(ajv);

ajv.addKeyword("cast", {
    type: ["string", "integer"],
    compile(schema) {
        const validateCoerced = ajv.compile(schema);
        return (data, dataPath, parentObject, property) => {
            if (schema.to === "bignumber") {
                parentObject[property] = new Bignum(data);
            } else {
                throw new Error(`Unable to cast to '${schema.to}'`);
            }

            return validateCoerced(data);
        };
    },
});

const instanceOf = ajvKeywords.get("instanceof").definition;
instanceOf.CONSTRUCTORS.Bignum = Bignum;

const x = { bla: "1", publicKey: "A".repeat(66), delegate: "1", amount: 0.00001 };
console.log(ajv.validate("test", x));
console.log(ajv.errors);
console.log(typeof x.amount);
console.log(x);
