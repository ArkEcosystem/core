import { Validation } from "@arkecosystem/crypto";
import { SocketErrors } from "../../enums";

export const validate = (schema, data) => {
    const ajv = Validation.AjvWrapper.instance();
    const errors = ajv.validate(schema, data) ? null : ajv.errors;

    if (errors) {
        const error = new Error(`Data validation error : ${JSON.stringify(errors, null, 4)}`);
        error.name = SocketErrors.Validation;

        throw error;
    }
};
