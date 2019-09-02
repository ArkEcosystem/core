import { Identifiers } from "../../ioc";
import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { Actions } from "./actions";

export class ServiceProvider extends BaseServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<Actions>(Identifiers.ActionService)
            .to(Actions)
            .inSingletonScope();
    }
}
