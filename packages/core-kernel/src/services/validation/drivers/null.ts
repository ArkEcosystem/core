import { Validator } from "../../../contracts/kernel/validation";
import { injectable } from "../../../ioc";
import { JsonObject } from "../../../types";

/**
 * @export
 * @class JoiValidator
 * @implements {Validator}
 */
@injectable()
export class NullValidator implements Validator {
    /**
     * Run the schema against the given data.
     *
     * @param {JsonObject} data
     * @param {object} schema
     * @memberof JoiValidator
     */
    public validate(data: JsonObject, schema: object): void {
        //
    }

    /**
     * Determine if the data passes the validation rules.
     *
     * @returns {boolean}
     * @memberof Validator
     */
    public passes(): boolean {
        return false;
    }

    /**
     * Determine if the data fails the validation rules.
     *
     * @returns {boolean}
     * @memberof Validator
     */
    public fails(): boolean {
        return true;
    }

    /**
     * Get the failed validation rules.
     *
     * @returns {Record<string, string[]>}
     * @memberof Validator
     */
    public failed(): Record<string, string[]> {
        return {};
    }

    /**
     * Get all of the validation error messages.
     *
     * @returns {Record<string, string[]>}
     * @memberof Validator
     */
    public errors(): Record<string, string[]> {
        return {};
    }

    /**
     * Returns the data which was valid.
     *
     * @returns {JsonObject}
     * @memberof Validator
     */
    public valid(): JsonObject | undefined {
        return undefined;
    }

    /**
     * Returns the data which was invalid.
     *
     * @returns {JsonObject}
     * @memberof Validator
     */
    public invalid(): JsonObject {
        return {};
    }

    /**
     * Get the data under validation.
     *
     * @returns {JsonObject}
     * @memberof Validator
     */
    public attributes(): JsonObject {
        return {};
    }
}
