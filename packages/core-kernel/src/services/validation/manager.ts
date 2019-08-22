import { IValidator } from "../../contracts/validation/validator";
import { AbstractManager } from "../../support/manager";
import { Joi } from "./drivers";

export class ValidationManager extends AbstractManager<IValidator> {
    /**
     * Create an instance of the Joi driver.
     *
     * @returns {IValidator}
     * @memberof ValidationManager
     */
    public createJoiDriver(): IValidator {
        return this.app.build(Joi);
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
