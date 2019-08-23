import { JsonObject } from "type-fest";

export interface IValidator {
    /**
     * Run the validator's rules against its data.
     *
     * @param {JsonObject} data
     * @param {object} schema
     * @memberof IValidator
     */
    validate(data: JsonObject, schema: object): void;

    /**
     * Determine if the data passes the validation rules.
     *
     * @returns {boolean}
     * @memberof IValidator
     */
    passes(): boolean;

    /**
     * Determine if the data fails the validation rules.
     *
     * @returns {boolean}
     * @memberof IValidator
     */
    fails(): boolean;

    /**
     * Get the failed validation rules.
     *
     * @returns {Record<string, string[]>}
     * @memberof IValidator
     */
    failed(): Record<string, string[]>;

    /**
     * Get all of the validation error messages.
     *
     * @returns {Record<string, string[]>}
     * @memberof IValidator
     */
    errors(): Record<string, string[]>;

    /**
     * Returns the data which was valid.
     *
     * @returns {JsonObject}
     * @memberof IValidator
     */
    valid(): JsonObject;

    /**
     * Returns the data which was invalid.
     *
     * @returns {JsonObject}
     * @memberof IValidator
     */
    invalid(): JsonObject;

    /**
     * Get the data under validation.
     *
     * @returns {JsonObject}
     * @memberof IValidator
     */
    attributes(): JsonObject;
}
