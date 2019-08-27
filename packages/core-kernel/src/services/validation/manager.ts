import { Validator } from "../../contracts/kernel/validation";
import { AbstractManager } from "../../support/manager";
import { Joi } from "./drivers";

/**
 * @export
 * @class ValidationManager
 * @extends {AbstractManager<Validator>}
 */
export class ValidationManager extends AbstractManager<Validator> {
    /**
     * Create an instance of the Joi driver.
     *
     * @returns {Validator}
     * @memberof ValidationManager
     */
    public createJoiDriver(): Validator {
        return this.app.resolve(Joi);
    }

    /**
     * Get the default log driver name.
     *
     * @protected
     * @returns {string}
     * @memberof ValidationManager
     */
    protected getDefaultDriver(): string {
        return "joi";
    }
}
