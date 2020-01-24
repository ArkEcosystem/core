import { Container, Providers } from "@arkecosystem/core-kernel";

import { Memory } from "./memory";
import { Storage } from "./storage";

/**
 * @export
 * @class Synchronizer
 */
@Container.injectable()
export class Synchronizer {
    /**
     * @private
     * @type {Providers.PluginConfiguration}
     * @memberof Synchronizer
     */
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    /**
     * @private
     * @type {Memory}
     * @memberof Synchronizer
     */
    @Container.inject(Container.Identifiers.TransactionPoolMemory)
    private readonly memory!: Memory;

    /**
     * @private
     * @type {Storage}
     * @memberof Synchronizer
     */
    @Container.inject(Container.Identifiers.TransactionPoolStorage)
    private readonly storage!: Storage;

    /**
     * @memberof Synchronizer
     */
    public syncToPersistentStorage(): void {
        this.storage.bulkAdd(this.memory.pullDirtyAdded());
        this.storage.bulkRemoveById(this.memory.pullDirtyRemoved());
    }

    /**
     * @memberof Synchronizer
     */
    public syncToPersistentStorageIfNecessary(): void {
        if (this.configuration.getRequired<number>("syncInterval") <= this.memory.countDirty()) {
            this.syncToPersistentStorage();
        }
    }
}
