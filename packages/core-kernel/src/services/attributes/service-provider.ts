import { Identifiers } from "../../ioc";
import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { AttributeService } from "./attribute-service";

export class ServiceProvider extends BaseServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<AttributeService>(Identifiers.AttributeService)
            .to(AttributeService)
            .inSingletonScope();
    }
}
