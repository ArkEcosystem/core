import { CacheStore as Contract } from "../../contracts/kernel";
import { Identifiers, interfaces } from "../../ioc";
import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { CacheManager } from "./manager";

export class ServiceProvider extends BaseServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.bind<CacheManager>(Identifiers.CacheManager).to(CacheManager).inSingletonScope();

        this.app
            .bind(Identifiers.CacheFactory)
            .toFactory((context: interfaces.Context) => async <K, T>(name?: string): Promise<Contract<K, T>> => {
                const cacheManager: CacheManager = context.container.get<CacheManager>(Identifiers.CacheManager);

                return cacheManager.driver<Contract<K, T>>(name);
            });
    }
}
