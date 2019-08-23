import { AbstractServiceProvider } from "../../support";
import { ValidationManager } from "./manager";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.singleton<ValidationManager>("validationManager", ValidationManager);

        await this.app.resolve<ValidationManager>("validationManager").boot();
    }
}
