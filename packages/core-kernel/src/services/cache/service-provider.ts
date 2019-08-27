import { AbstractServiceProvider } from "../../providers";
import { CacheManager } from "./manager";
import { Identifiers } from "../../container";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<CacheManager>(Identifiers.CacheManager)
            .to(CacheManager)
            .inSingletonScope();

        await this.app.get<CacheManager>(Identifiers.CacheManager).boot();
    }
}
