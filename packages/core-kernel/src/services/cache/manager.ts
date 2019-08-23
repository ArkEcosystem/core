import { ICacheStore } from "../../contracts/core-kernel";
import { AbstractManager } from "../../support/manager";
import { Memory } from "./drivers";

// @TODO: add K,T to the ICacheStore interface
export class CacheManager extends AbstractManager<ICacheStore> {
    /**
     * Create an instance of the Memory driver.
     *
     * @returns {Promise<ICacheStore>}
     * @memberof CacheManager
     */
    public async createMemoryDriver(): Promise<ICacheStore> {
        return this.app.build(Memory).make();
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
