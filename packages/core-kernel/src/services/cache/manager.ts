import { AbstractManager } from "../../support/manager";
import { Memory } from "./drivers";

export class CacheManager extends AbstractManager<any> {
    /**
     * Create an instance of the Memory driver.
     *
     * @returns {Promise<any>}
     * @memberof CacheManager
     */
    public async createMemoryDriver(): Promise<any> {
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
