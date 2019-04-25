// tslint:disable:variable-name

import { app } from "@arkecosystem/core-container";
import { Logger, State } from "@arkecosystem/core-interfaces";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import assert from "assert";
import { OrderedMap, OrderedSet, Seq } from "immutable";

/**
 * Represents an in-memory storage for state machine data.
 */
export class StateStorage implements State.IStateStorage {
    // @TODO: make all properties private and expose them one-by-one through a getter if used outside of this class
    public blockchain: any = {};
    public lastDownloadedBlock: Interfaces.IBlock | null = null;
    public blockPing: any = null;
    public started: boolean = false;
    public forkedBlock: Interfaces.IBlock | null = null;
    public wakeUpTimeout: any = null;
    public noBlockCounter: number = 0;
    public p2pUpdateCounter: number = 0;
    public numberOfBlocksToRollback: number | null = null;
    public networkStart: boolean = false;
    // Stores the last n blocks in ascending height. The amount of last blocks
    // can be configured with the option `state.maxLastBlocks`.
    private lastBlocks: OrderedMap<number, Interfaces.IBlock> = OrderedMap<number, Interfaces.IBlock>();
    // Stores the last n incoming transaction ids. The amount of transaction ids
    // can be configred with the option `state.maxLastTransactionIds`.
    private cachedTransactionIds: OrderedSet<string> = OrderedSet();

    /**
     * Resets the state.
     * @TODO: remove the need for this method.
     */
    public reset(blockchainMachine): void {
        this.blockchain = blockchainMachine.initialState;
    }

    /**
     * Clear last blocks.
     */
    public clear(): void {
        this.lastBlocks = this.lastBlocks.clear();
        this.cachedTransactionIds = this.cachedTransactionIds.clear();
    }

    /**
     * Clear check later timeout.
     */
    public clearWakeUpTimeout(): void {
        if (this.wakeUpTimeout) {
            clearTimeout(this.wakeUpTimeout);
            this.wakeUpTimeout = null;
        }
    }

    /**
     * Get the last block height.
     */
    public getLastHeight(): number {
        return this.getLastBlock().data.height;
    }

    /**
     * Get the last block.
     */
    public getLastBlock(): Interfaces.IBlock | null {
        return this.lastBlocks.last() || null;
    }

    /**
     * Sets the last block.
     */
    public setLastBlock(block: Interfaces.IBlock): void {
        // Only keep blocks which are below the new block height (i.e. rollback)
        if (this.lastBlocks.last() && this.lastBlocks.last<Interfaces.IBlock>().data.height !== block.data.height - 1) {
            assert(block.data.height - 1 <= this.lastBlocks.last<Interfaces.IBlock>().data.height);
            this.lastBlocks = this.lastBlocks.filter(b => b.data.height < block.data.height);
        }

        this.lastBlocks = this.lastBlocks.set(block.data.height, block);
        Managers.configManager.setHeight(block.data.height);
        Transactions.TransactionRegistry.updateStaticFees(block.data.height);

        // Delete oldest block if size exceeds the maximum
        if (this.lastBlocks.size > app.resolveOptions("state").storage.maxLastBlocks) {
            this.lastBlocks = this.lastBlocks.delete(this.lastBlocks.first<Interfaces.IBlock>().data.height);
        }
    }

    /**
     * Get the last blocks.
     */
    public getLastBlocks(): Interfaces.IBlock[] {
        return this.lastBlocks
            .valueSeq()
            .reverse()
            .toArray();
    }

    /**
     * Get the last blocks data.
     */
    public getLastBlocksData(): Seq<number, Interfaces.IBlockData> {
        return this.mapToBlockData(this.lastBlocks.valueSeq().reverse());
    }

    /**
     * Get the last block ids.
     */
    public getLastBlockIds(): string[] {
        return this.lastBlocks
            .valueSeq()
            .reverse()
            .map(b => b.data.id)
            .toArray();
    }

    /**
     * Get last blocks in the given height range in ascending order.
     * @param {Number} start
     * @param {Number} end
     */
    public getLastBlocksByHeight(start: number, end?: number): Interfaces.IBlockData[] {
        end = end || start;

        const blocks = this.lastBlocks
            .valueSeq()
            .filter(block => block.data.height >= start && block.data.height <= end);

        return this.mapToBlockData(blocks).toArray() as Interfaces.IBlockData[];
    }

    /**
     * Get common blocks for the given IDs.
     */
    public getCommonBlocks(ids: string[]): Interfaces.IBlockData[] {
        const idsHash = {};

        ids.forEach(id => (idsHash[id] = true));

        return this.getLastBlocksData()
            .filter(block => idsHash[block.id])
            .toArray() as Interfaces.IBlockData[];
    }

    /**
     * Cache the ids of the given transactions.
     */
    public cacheTransactions(
        transactions: Interfaces.ITransactionData[],
    ): { added: Interfaces.ITransactionData[]; notAdded: Interfaces.ITransactionData[] } {
        const notAdded: Interfaces.ITransactionData[] = [];
        const added: Interfaces.ITransactionData[] = transactions.filter(tx => {
            if (this.cachedTransactionIds.has(tx.id)) {
                notAdded.push(tx);
                return false;
            }
            return true;
        });

        this.cachedTransactionIds = this.cachedTransactionIds.withMutations(cache => {
            added.forEach(tx => cache.add(tx.id));
        });

        // Cap the Set of last transaction ids to maxLastTransactionIds
        const limit = app.resolveOptions("state").storage.maxLastTransactionIds;
        if (this.cachedTransactionIds.size > limit) {
            this.cachedTransactionIds = this.cachedTransactionIds.takeLast(limit);
        }

        return { added, notAdded };
    }

    /**
     * Remove the given transaction ids from the cache.
     */
    public removeCachedTransactionIds(transactionIds: string[]): void {
        this.cachedTransactionIds = this.cachedTransactionIds.subtract(transactionIds);
    }

    /**
     * Get cached transaction ids.
     */
    public getCachedTransactionIds(): string[] {
        return this.cachedTransactionIds.toArray();
    }

    /**
     * Ping a block.
     */
    public pingBlock(incomingBlock: Interfaces.IBlockData): boolean {
        if (!this.blockPing) {
            return false;
        }

        if (this.blockPing.block.height === incomingBlock.height && this.blockPing.block.id === incomingBlock.id) {
            this.blockPing.count++;
            this.blockPing.last = new Date().getTime();

            return true;
        }

        return false;
    }

    /**
     * Push ping block.
     */
    public pushPingBlock(block: Interfaces.IBlockData, fromForger: boolean = false): void {
        if (this.blockPing) {
            app.resolvePlugin<Logger.ILogger>("logger").info(
                `Block ${this.blockPing.block.height.toLocaleString()} pinged blockchain ${this.blockPing.count} times`,
            );
        }

        this.blockPing = {
            count: fromForger ? 0 : 1,
            first: new Date().getTime(),
            last: new Date().getTime(),
            block,
        };
    }

    // Map Block instances to block data.
    private mapToBlockData(blocks: Seq<number, Interfaces.IBlock>): Seq<number, Interfaces.IBlockData> {
        return blocks.map(block => ({ ...block.data, transactions: block.transactions.map(tx => tx.data) }));
    }
}
