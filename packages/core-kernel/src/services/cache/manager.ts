import { CacheStore } from "../../contracts/kernel/cache";
import { Manager } from "../../support/manager";
import { MemoryCacheStore } from "./drivers";

/**
 * @todo: add K,T to the CacheStore interface
 *
 * @export
 * @class CacheManager
 * @extends {Manager<CacheStore>}
 */
export class CacheManager extends Manager<CacheStore> {
    /**
     * Create an instance of the Memory driver.
     *
     * @protected
     * @returns {Promise<CacheStore>}
     * @memberof CacheManager
     */
    protected async createMemoryDriver(): Promise<CacheStore> {
        return this.app.resolve<CacheStore>(MemoryCacheStore).make();
    }

    /**
     * Get the default log driver name.
     *
     * @protected
     * @returns {string}
     * @memberof CacheManager
     */
    protected getDefaultDriver(): string {
        return "memory";
    }
}
