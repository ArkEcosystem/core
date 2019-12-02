import { Validator } from "../../contracts/kernel/validation";
import { InstanceManager } from "../../support/instance-manager";
import { JoiValidator } from "./drivers/joi";

/**
 * @export
 * @class ValidationManager
 * @extends {Manager<Validator>}
 */
export class ValidationManager extends InstanceManager<Validator> {
    /**
     * Create an instance of the Joi driver.
     *
     * @protected
     * @returns {Validator}
     * @memberof ValidationManager
     */
    protected createJoiDriver(): Validator {
        return this.app.resolve(JoiValidator);
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
