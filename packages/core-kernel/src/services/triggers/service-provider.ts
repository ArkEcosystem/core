import { Identifiers } from "../../ioc";
import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { Triggers } from "./triggers";

export class ServiceProvider extends BaseServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.bind<Triggers>(Identifiers.TriggerService).to(Triggers).inSingletonScope();
    }
}
