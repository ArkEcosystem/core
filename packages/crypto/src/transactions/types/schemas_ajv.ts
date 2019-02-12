import Ajv from "ajv";
import ajvKeywords from "ajv-keywords";

const schemas = {
    hex: {
        $id: "#hex",
        type: "string",
        pattern: "^[0123456789A-Fa-f]+$",
    },

    base58: {
        $id: "base58",
        type: "string",
        pattern: "^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$",
    },

    address: {
        $id: "address",
        allOf: [
            { $ref: "base58" },
            {
                minLength: 34,
                maxLength: 34,
            },
        ],
    },

    blockId: {
        $id: "blockId",
        type: "string",
        pattern: "^[0-9]+$",
    },

    publicKey: {
        $id: "publicKey",
        allOf: [{ $ref: "hex" }, { minLength: 66, maxLength: 66 }],
        transform: ["lowercase"],
    },
};

const ajv = new Ajv({ $data: true, schemas, coerceTypes: true });
ajvKeywords(ajv);

const x = "A".repeat(66);
console.log(ajv.validate("publicKey", x));
console.log(ajv.errors);
console.log(x);
