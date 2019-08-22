import { AbstractManager } from "../../support/manager";
import { Joi } from "./drivers";

export class ValidationManager extends AbstractManager<any> {
    /**
     * Create an instance of the Joi driver.
     *
     * @returns {Promise<any>}
     * @memberof ValidationManager
     */
    public async createJoiDriver(): Promise<any> {
        return this.app.build(Joi).make();
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
