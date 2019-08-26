import { IValidator } from "../../contracts/kernel/validation";
import { AbstractManager } from "../../support/manager";
import { Joi } from "./drivers";

/**
 * @export
 * @class ValidationManager
 * @extends {AbstractManager<IValidator>}
 */
export class ValidationManager extends AbstractManager<IValidator> {
    /**
     * Create an instance of the Joi driver.
     *
     * @returns {IValidator}
     * @memberof ValidationManager
     */
    public createJoiDriver(): IValidator {
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
