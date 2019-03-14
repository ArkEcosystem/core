import { AjvWrapper } from "@arkecosystem/crypto";
import { SocketErrors } from "../constants";

/**
 * Validate the data vs schema provided. Throws if validation failed.
 * @param  {Object} schema
 * @param  {Object} data
 * @throws {Error} Validation error object
 */
export const validate = (schema, data) => {
    const ajv = AjvWrapper.instance();
    const errors = ajv.validate(schema, data) ? null : ajv.errors;
    if (errors) {
        const error = new Error(`Data validation error : ${JSON.stringify(errors, null, 2)}`);
        error.name = SocketErrors.Validation;
        throw error;
    }
};
