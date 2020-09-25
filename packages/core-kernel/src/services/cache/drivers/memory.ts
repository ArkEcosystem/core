import { EventDispatcher } from "../../../contracts/kernel";
import { CacheStore } from "../../../contracts/kernel/cache";
import { CacheEvent } from "../../../enums";
import { NotImplemented } from "../../../exceptions/runtime";
import { Identifiers, inject, injectable } from "../../../ioc";

/**
 * @export
 * @class MemoryCacheStore
 * @implements {CacheStore}
 */
@injectable()
export class MemoryCacheStore<K, T> implements CacheStore<K, T> {
    /**
     * @private
     * @type {EventDispatcher}
     * @memberof BlockJob
     */
    @inject(Identifiers.EventDispatcherService)
    private readonly eventDispatcher!: EventDispatcher;

    /**
     * @private
     * @type {Map<K, T>}
     * @memberof MemoryCacheStore
     */
    private readonly store: Map<K, T> = new Map<K, T>();

    /**
     * Create a new instance of the cache store.
     *
     * @param {Application} app
     * @returns {CacheStore<K, T>}
     * @memberof CacheStore
     */
    public async make(): Promise<CacheStore<K, T>> {
        return this;
    }

    /**
     * Get all of the items in the cache.
     *
     * @returns {Array<[K, T]>}
     * @memberof MemoryCacheStore
     */
    public async all(): Promise<Array<[K, T]>> {
        return [...this.store.entries()];
    }

    /**
     * Get the keys of the cache items.
     *
     * @returns {K[]}
     * @memberof MemoryCacheStore
     */
    public async keys(): Promise<K[]> {
        return [...this.store.keys()];
    }

    /**
     * Get the values of the cache items.
     *
     * @returns {T[]}
     * @memberof MemoryCacheStore
     */
    public async values(): Promise<T[]> {
        return [...this.store.values()];
    }

    /**
     * Retrieve an item from the cache by key.
     *
     * @param {K} key
     * @returns {(T | undefined)}
     * @memberof MemoryCacheStore
     */
    public async get(key: K): Promise<T | undefined> {
        const value: T | undefined = this.store.get(key);

        value
            ? this.eventDispatcher.dispatch(CacheEvent.Hit, { key, value })
            : this.eventDispatcher.dispatch(CacheEvent.Missed, { key });

        return value;
    }

    /**
     * Retrieve multiple items from the cache by key.
     *
     * @param {K[]} keys
     * @returns {(Array<T | undefined>)}
     * @memberof MemoryCacheStore
     */
    public async getMany(keys: K[]): Promise<Array<T | undefined>> {
        return keys.map((key: K) => this.store.get(key));
    }

    /**
     * Store an item in the cache for a given number of seconds.
     *
     * @param {K} key
     * @param {T} value
     * @param {number} seconds
     * @returns {boolean}
     * @memberof MemoryCacheStore
     */
    public async put(key: K, value: T, seconds?: number): Promise<boolean> {
        this.store.set(key, value);

        this.eventDispatcher.dispatch(CacheEvent.Written, { key, value, seconds });

        return this.has(key);
    }

    /**
     * Store multiple items in the cache for a given number of seconds.
     *
     * @param {Array<[K, T]>} values
     * @param {number} seconds
     * @returns {boolean[]}
     * @memberof MemoryCacheStore
     */
    public async putMany(values: Array<[K, T]>, seconds?: number): Promise<boolean[]> {
        return Promise.all(values.map(async (value: [K, T]) => this.put(value[0], value[1])));
    }

    /**
     * Determine if an item exists in the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof MemoryCacheStore
     */
    public async has(key: K): Promise<boolean> {
        return this.store.has(key);
    }

    /**
     * Determine multiple items exist in the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof MemoryCacheStore
     */
    public async hasMany(keys: K[]): Promise<boolean[]> {
        return Promise.all(keys.map(async (key: K) => this.has(key)));
    }

    /**
     * Determine if an item doesn't exist in the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof MemoryCacheStore
     */
    public async missing(key: K): Promise<boolean> {
        return !this.store.has(key);
    }

    /**
     * Determine multiple items don't exist in the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof MemoryCacheStore
     */
    public async missingMany(keys: K[]): Promise<boolean[]> {
        return Promise.all([...keys].map(async (key: K) => this.missing(key)));
    }

    /**
     * Store an item in the cache indefinitely.
     *
     * @param {K} key
     * @param {T} value
     * @returns {boolean}
     * @memberof MemoryCacheStore
     */
    public async forever(key: K, value: T): Promise<boolean> {
        throw new NotImplemented(this.constructor.name, "forever");
    }

    /**
     * Store multiple items in the cache indefinitely.
     *
     * @param {Array<[K, T]>} values
     * @returns {boolean[]}
     * @memberof MemoryCacheStore
     */
    public async foreverMany(values: Array<[K, T]>): Promise<boolean[]> {
        throw new NotImplemented(this.constructor.name, "foreverMany");
    }

    /**
     * Remove an item from the cache.
     *
     * @param {K} key
     * @returns {boolean}
     * @memberof MemoryCacheStore
     */
    public async forget(key: K): Promise<boolean> {
        this.store.delete(key);

        this.eventDispatcher.dispatch(CacheEvent.Forgotten, { key });

        return this.missing(key);
    }

    /**
     * Remove multiple items from the cache.
     *
     * @param {K[]} keys
     * @returns {boolean[]}
     * @memberof MemoryCacheStore
     */
    public async forgetMany(keys: K[]): Promise<boolean[]> {
        return Promise.all(keys.map(async (key: K) => this.forget(key)));
    }

    /**
     * Remove all items from the cache.
     *
     * @returns {boolean}
     * @memberof MemoryCacheStore
     */
    public async flush(): Promise<boolean> {
        this.store.clear();

        this.eventDispatcher.dispatch(CacheEvent.Flushed);

        return this.store.size === 0;
    }

    /**
     * Get the cache key prefix.
     *
     * @returns {string}
     * @memberof MemoryCacheStore
     */
    public async getPrefix(): Promise<string> {
        throw new NotImplemented(this.constructor.name, "getPrefix");
    }
}
