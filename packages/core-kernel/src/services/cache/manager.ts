import { CacheStore } from "../../contracts/kernel";
import { injectable } from "../../ioc";
import { ClassManager } from "../../support/class-manager";
import { MemoryCacheStore } from "./drivers/memory";

/**
 * @export
 * @class CacheManager
 * @extends {ClassManager}
 */
@injectable()
export class CacheManager extends ClassManager {
    /**
     * Create an instance of the Memory driver.
     *
     * @protected
     * @returns {Promise<Logger>}
     * @memberof CacheManager
     */
    protected async createMemoryDriver<K, T>(): Promise<CacheStore<K, T>> {
        return this.app.resolve<CacheStore<K, T>>(MemoryCacheStore).make();
    }

    /**
     * Get the default driver name.
     *
     * @protected
     * @returns {string}
     * @memberof ValidationManager
     */
    protected getDefaultDriver(): string {
        return "memory";
    }
}
