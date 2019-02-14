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

    alphanumeric: {
        $id: "alphanumeric",
        type: "string",
        pattern: "^[a-zA-Z0-9]+$",
    },

    transactionId: {
        $id: "transactionId",
        allOf: [{ minLength: 64 }, { maxLength: 64 }, { $ref: "alphanumeric" }],
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

    baseTx: {
        type: "object",
        required: ["id", "signature", "senderPublicKey", "recipientId", "amount", "fee"],
        properties: {
            id: { $ref: "transactionId" },
            version: { enum: [1, 2] },
            type: { type: "integer", minimum: 0, maximum: 255 },
            timestamp: { type: "integer", minimum: 0 },
            amount: { $ref: "bignumber" },
            fee: { $ref: "bignumber" },
            recipientId: { $ref: "address" },
            senderPublicKey: { $ref: "publicKey" },
            signature: { $ref: "alphanumeric" },
            secondSignature: { $ref: "alphanumeric" },
        },
    },
};

const blblbbl = {
    version: 221,
    network: 23,
    type: 0,
    timestamp: 58126413,
    senderPublicKey: "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
    fee: "10000000",
    amount: "200000000",
    vendorFieldHex: "5472616e73616374696f6e2037",
    expiration: 0,
    recipientId: "APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq",
    signature:
        "3045022100bac5b7699748a891b39ff5439e16ea1a694e93954b248be6b8082da01e5386310220129eb06a58b9f80d36ea3cdc903e6cc0240bbe1d371339ffe15c87742af1427d",
    vendorField: "Transaction 7",
    id: "00d2025f7914a8e794bdaea404a579840cf71402cef312d2080c7ecd86177e5f",
};

const ajv = new Ajv({ $data: true, schemas, removeAdditional: "all" });
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

console.log(ajv.validate("baseTx", blblbbl));
console.log(ajv.errors);
console.log(blblbbl);
