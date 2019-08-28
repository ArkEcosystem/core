import { validate } from "@hapi/joi";
import { ValidationErrorItem } from "@hapi/joi";
import { JsonObject } from "../../../types";
import { Validator } from "../../../contracts/kernel/validation";
import { injectable } from "../../../container";

/**
 * @export
 * @class JoiValidator
 * @implements {Validator}
 */
@injectable()
export class JoiValidator implements Validator {
    /**
     * The data under validation.
     *
     * @private
     * @type {JsonObject}
     * @memberof JoiValidator
     */
    private data: JsonObject;

    /**
     * The validated data.
     *
     * @private
     * @type {(JsonObject | undefined)}
     * @memberof JoiValidator
     */
    private resultValue: JsonObject | undefined;

    /**
     * The error messages.
     *
     * @private
     * @type {(ValidationErrorItem[] | undefined)}
     * @memberof JoiValidator
     */
    private resultError: ValidationErrorItem[] | undefined;

    /**
     * Run the schema against the given data.
     *
     * @param {JsonObject} data
     * @param {object} schema
     * @memberof JoiValidator
     */
    public validate(data: JsonObject, schema: object): void {
        this.data = data;

        const { error, value } = validate(this.data, schema);

        this.resultValue = error ? undefined : value;

        if (error) {
            this.resultError = error.details;
        }
    }

    /**
     * Determine if the data passes the validation rules.
     *
     * @returns {boolean}
     * @memberof Validator
     */
    public passes(): boolean {
        return !this.resultError;
    }

    /**
     * Determine if the data fails the validation rules.
     *
     * @returns {boolean}
     * @memberof Validator
     */
    public fails(): boolean {
        return !this.passes();
    }

    /**
     * Get the failed validation rules.
     *
     * @returns {Record<string, string[]>}
     * @memberof Validator
     */
    public failed(): Record<string, string[]> {
        return this.groupErrors("type");
    }

    /**
     * Get all of the validation error messages.
     *
     * @returns {Record<string, string[]>}
     * @memberof Validator
     */
    public errors(): Record<string, string[]> {
        return this.groupErrors("message");
    }

    /**
     * Returns the data which was valid.
     *
     * @returns {JsonObject}
     * @memberof Validator
     */
    public valid(): JsonObject {
        return this.resultValue;
    }

    /**
     * Returns the data which was invalid.
     *
     * @returns {JsonObject}
     * @memberof Validator
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
     * @memberof Validator
     */
    public attributes(): JsonObject {
        return this.data;
    }

    /**
     * @private
     * @param {string} attribute
     * @returns {Record<string, string[]>}
     * @memberof JoiValidator
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
