import { Container } from "@arkecosystem/core-kernel";

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
     * @private
     * @type {number}
     * @memberof Synchronizer
     */
    private syncInterval!: number;

    /**
     * @param {number} syncInterval
     * @returns
     * @memberof Synchronizer
     */
    public initialize(syncInterval: number) {
        this.syncInterval = syncInterval;

        return this;
    }

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
        if (this.syncInterval <= this.memory.countDirty()) {
            this.syncToPersistentStorage();
        }
    }
}
