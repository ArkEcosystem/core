import Joi from "joi";

import { injectable } from "../ioc";

/**
 * @export
 * @class InputValidator
 */
@injectable()
export class InputValidator {
    /**
     * @param {object} data
     * @param {object} schema
     * @returns {object}
     * @memberof InputValidator
     */
    public validate(data: object, schema: object): object {
        const { error, value } = Joi.object(schema).unknown(true).validate(data);

        if (error) {
            let errorMessage: string = "";

            for (const err of error.details) {
                errorMessage += err.message;
            }

            throw new Error(errorMessage);
        }

        return value;
    }
}
