import { IApplication, ICacheStore } from "../../contracts/core-kernel";
import { CacheFactory } from "./factory";

/**
 * @export
 * @class CacheManager
 */
export class CacheManager {
    /**
     * @private
     * @type {CacheFactory}
     * @memberof CacheManager
     */
    private readonly factory: CacheFactory;

    /**
     * @private
     * @type {Map<string, ICacheStore>}
     * @memberof CacheManager
     */
    private readonly drivers: Map<string, ICacheStore> = new Map<string, ICacheStore>();

    /**
     * @param {IApplication} app
     * @memberof CacheManager
     */
    public constructor(app: IApplication) {
        this.factory = new CacheFactory(app);
    }

    /**
     * @param {string} [name="default"]
     * @returns {ICacheStore}
     * @memberof CacheManager
     */
    public driver(name: string = "default"): ICacheStore {
        return this.drivers.get(name);
    }

    /**
     * @param {ICacheStore} driver
     * @param {string} [name="default"]
     * @returns {ICacheStore}
     * @memberof CacheManager
     */
    public createDriver(driver: ICacheStore, name: string = "default"): ICacheStore {
        this.drivers.set(name, this.factory.make(driver));

        return this.driver();
    }

    /**
     * @returns {Map<string, ICacheStore>}
     * @memberof CacheManager
     */
    public getDrivers(): Map<string, ICacheStore> {
        return this.drivers;
    }

    /**
     * @returns {CacheFactory}
     * @memberof CacheManager
     */
    public getFactory(): CacheFactory {
        return this.factory;
    }
}
