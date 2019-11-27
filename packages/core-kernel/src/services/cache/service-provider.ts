import { CacheStore as Contract } from "../../contracts/kernel";
import { Identifiers, interfaces } from "../../ioc";
import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { MemoryCacheStore } from "./drivers/memory";

export class ServiceProvider extends BaseServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind(Identifiers.CacheFactory)
            .toFactory((context: interfaces.Context) => <K, T>(): Contract<K, T> =>
                context.container.resolve<Contract<K, T>>(MemoryCacheStore),
            );
    }
}
