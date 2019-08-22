import { ValidationErrorItem } from "@hapi/joi";
import { JsonObject } from "type-fest";
import { IValidator } from "../../../contracts/validation/validator";

export class Joi implements IValidator {
    /**
     * @private
     * @type {*}
     * @memberof Joi
     */
    private data: any;

    /**
     * @private
     * @type {*}
     * @memberof Joi
     */
    private resultValue: any;

    /**
     * @private
     * @type {ValidationErrorItem[]}
     * @memberof Joi
     */
    private resultError: ValidationErrorItem[];

    /**
     * Run the validator's rules against its data.
     *
     * @memberof IValidator
     */
    public validate<T>(data: T, schema: any): this {
        this.data = data;

        const { error, value } = schema.validate(data);

        this.resultValue = error.details ? undefined : value;
        this.resultError = error.details;

        return this;
    }

    /**
     * Determine if the data passes the validation rules.
     *
     * @returns {boolean}
     * @memberof IValidator
     */
    public passes(): boolean {
        return !this.resultError;
    }

    /**
     * Determine if the data fails the validation rules.
     *
     * @returns {boolean}
     * @memberof IValidator
     */
    public fails(): boolean {
        return !this.passes();
    }

    /**
     * Get the failed validation rules.
     *
     * @returns {Record<string, string[]>}
     * @memberof IValidator
     */
    public failed(): Record<string, string[]> {
        return this.groupErrors("type");
    }

    /**
     * Get all of the validation error messages.
     *
     * @returns {string[]}
     * @memberof IValidator
     */
    public errors(): Record<string, string[]> {
        return this.groupErrors("message");
    }

    /**
     * Returns the data which was valid.
     *
     * @returns {JsonObject}
     * @memberof IValidator
     */
    public valid(): JsonObject {
        return this.resultValue;
    }

    /**
     * Returns the data which was invalid.
     *
     * @returns {JsonObject}
     * @memberof IValidator
     */
    public invalid(): JsonObject {
        const errors: JsonObject = {};

        for (const error of this.resultError) {
            errors[error.context.key] = error.context.value;
        }

        return errors;
    }

    /**
     * Get the data under validation.
     *
     * @returns {JsonObject}
     * @memberof IValidator
     */
    public attributes(): JsonObject {
        return this.data;
    }

    /**
     * @private
     * @param {string} attribute
     * @returns {Record<string, string[]>}
     * @memberof Joi
     */
    private groupErrors(attribute: string): Record<string, string[]> {
        const errors: Record<string, string[]> = {};

        for (const error of this.resultError) {
            const errorKey: string = error.path[0];

            if (!Array.isArray(errors[errorKey])) {
                errors[errorKey] = [];
            }

            errors[errorKey].push(error[attribute]);
        }

        return errors;
    }
}
