import { Identifiers } from "../../container";
import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { MixinService } from "./mixins";

export class ServiceProvider extends BaseServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<MixinService>(Identifiers.MixinService)
            .to(MixinService)
            .inSingletonScope();
    }
}
