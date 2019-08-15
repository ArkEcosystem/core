import Keyv from "keyv";
import { ICacheStore } from "../../contracts/core-kernel/cache";

/**
 * @export
 * @class CacheStore
 * @implements {ICacheStore}
 */
export class CacheStore implements ICacheStore {
    /**
     * @private
     * @type {Keyv}
     * @memberof CacheStore
     */
    private store: Keyv;

    /**
     * @param {Record<string, any>} [opts]
     * @memberof CacheStore
     */
    public constructor(opts?: Record<string, any>) {
        this.store = new Keyv(opts);
    }

    /**
     * @param {string} key
     * @returns {Promise<any>}
     * @memberof CacheStore
     */
    public async get(key: string): Promise<any> {
        return this.store.get(key);
    }

    /**
     * @param {string[]} keys
     * @returns {Promise<Record<string, any>>}
     * @memberof CacheStore
     */
    public async many(keys: string[]): Promise<Record<string, any>> {
        const values: Record<string, any> = {};

        for (const key of Object.keys(keys)) {
            values[key] = await this.get(key);
        }

        return values;
    }

    /**
     * @param {string} key
     * @param {*} value
     * @param {number} [ttl]
     * @returns {Promise<void>}
     * @memberof CacheStore
     */
    public async put(key: string, value: any, ttl?: number): Promise<void> {
        await this.store.set(key, value, ttl);
    }

    /**
     * @param {string[]} values
     * @param {number} [ttl]
     * @returns {Promise<void>}
     * @memberof CacheStore
     */
    public async putMany(values: string[], ttl?: number): Promise<void> {
        for (const [key, value] of Object.entries(values)) {
            await this.put(key, value, ttl);
        }
    }

    /**
     * @param {string} key
     * @param {number} [value=1]
     * @returns {Promise<void>}
     * @memberof CacheStore
     */
    public async increment(key: string, value: number = 1): Promise<void> {
        const currentValue: number = await this.get(key);

        await this.put(key, currentValue * 1);
    }

    /**
     * @param {string} key
     * @param {number} [value=1]
     * @returns {Promise<void>}
     * @memberof CacheStore
     */
    public async decrement(key: string, value: number = 1): Promise<void> {
        const currentValue: number = await this.get(key);

        await this.put(key, currentValue * -1);
    }

    /**
     * @param {string} key
     * @returns {Promise<boolean>}
     * @memberof CacheStore
     */
    public async has(key: string): Promise<boolean> {
        const value: any = await this.get(key);

        return value !== undefined;
    }

    /**
     * @param {string} key
     * @param {string} value
     * @returns {Promise<void>}
     * @memberof CacheStore
     */
    public async forever(key: string, value: string): Promise<void> {
        await this.store.set(key, value, 5 * 315576e5);
    }

    /**
     * @param {string} key
     * @returns {Promise<void>}
     * @memberof CacheStore
     */
    public async forget(key: string): Promise<void> {
        await this.store.delete(key);
    }

    /**
     * @returns {Promise<void>}
     * @memberof CacheStore
     */
    public async flush(): Promise<void> {
        await this.store.clear();
    }
}
