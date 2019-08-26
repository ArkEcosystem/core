import { AbstractServiceProvider } from "../../providers";
import { ValidationManager } from "./manager";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.ioc
            .bind<ValidationManager>("validationManager")
            .to(ValidationManager)
            .inSingletonScope();

        await this.app.ioc.get<ValidationManager>("validationManager").boot();
    }
}
