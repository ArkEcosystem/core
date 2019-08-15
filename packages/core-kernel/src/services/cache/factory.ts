import { Kernel } from "../../contracts";

/**
 * @export
 * @class CacheFactory
 */
export class CacheFactory {
    /**
     * @param {Kernel.IApplication} app
     * @memberof CacheFactory
     */
    public constructor(private readonly app: Kernel.IApplication) {}

    /**
     * @param {Kernel.ICacheStore} store
     * @returns {Kernel.ICacheStore}
     * @memberof CacheFactory
     */
    public async make<K, T>(store: Kernel.ICacheStore<K, T>): Promise<Kernel.ICacheStore<K, T>> {
        return store.make(this.app);
    }
}
