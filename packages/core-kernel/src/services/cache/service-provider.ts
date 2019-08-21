import { PackageJson } from "type-fest";
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
    }

    /**
     * Get the manifest of the service provider.
     *
     * @returns {PackageJson}
     * @memberof ServiceProvider
     */
    public manifest(): PackageJson {
        return {};
    }
}
