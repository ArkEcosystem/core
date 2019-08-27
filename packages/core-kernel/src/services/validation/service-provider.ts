import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { ValidationManager } from "./manager";
import { Identifiers } from "../../container";

export class ServiceProvider extends BaseServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<ValidationManager>(Identifiers.ValidationManager)
            .to(ValidationManager)
            .inSingletonScope();

        await this.app.get<ValidationManager>(Identifiers.ValidationManager).boot();
    }
}
