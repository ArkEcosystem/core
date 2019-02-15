import { Ajv } from "ajv";

export const transactionType = (ajv: Ajv) => {
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
