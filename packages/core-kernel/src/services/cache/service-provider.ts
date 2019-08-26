import { AbstractServiceProvider } from "../../support";
import { CacheManager } from "./manager";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.ioc
            .bind<CacheManager>("cacheManager")
            .to(CacheManager)
            .inSingletonScope();

        await this.app.ioc.get<CacheManager>("cacheManager").boot();
    }
}
