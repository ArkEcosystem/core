import { Validation } from "@arkecosystem/core-crypto";

import { SocketErrors } from "../../enums";

export const validate = (schema, data, validator: Validation.Validator) => {
    const { error: validationError } = validator.validate(schema, data);

    if (validationError) {
        const error = new Error(`Data validation error : ${validationError}`);
        error.name = SocketErrors.Validation;

        throw error;
    }
};
