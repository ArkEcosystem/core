import { AbstractServiceProvider } from "../../providers";
import { CacheManager } from "./manager";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<CacheManager>("cacheManager")
            .to(CacheManager)
            .inSingletonScope();

        await this.app.get<CacheManager>("cacheManager").boot();
    }
}
