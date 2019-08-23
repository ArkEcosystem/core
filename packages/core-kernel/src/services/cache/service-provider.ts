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
        this.app.singleton("cacheManager", CacheManager);

        await this.app.resolve<CacheManager>("cacheManager").boot();
    }
}
