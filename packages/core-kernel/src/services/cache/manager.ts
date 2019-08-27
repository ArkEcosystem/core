import { CacheStore } from "../../contracts/kernel/cache";
import { Manager } from "../../support/manager";
import { Memory } from "./drivers";

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
     * @returns {Promise<CacheStore>}
     * @memberof CacheManager
     */
    public async createMemoryDriver(): Promise<CacheStore> {
        return this.app.resolve<CacheStore>(Memory).make();
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
