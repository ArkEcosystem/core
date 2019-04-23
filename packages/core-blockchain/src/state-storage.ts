// tslint:disable:variable-name

import { app } from "@arkecosystem/core-container";
import { Blockchain, Logger } from "@arkecosystem/core-interfaces";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import assert from "assert";
import immutable from "immutable";
import { blockchainMachine } from "./machines/blockchain";

const logger = app.resolvePlugin<Logger.ILogger>("logger");

// Stores the last n blocks in ascending height. The amount of last blocks
// can be configured with the option `state.maxLastBlocks`.
let _lastBlocks: immutable.OrderedMap<number, Interfaces.IBlock> = immutable.OrderedMap<number, Interfaces.IBlock>();

// Stores the last n incoming transaction ids. The amount of transaction ids
// can be configred with the option `state.maxLastTransactionIds`.
let _cachedTransactionIds: immutable.OrderedSet<string> = immutable.OrderedSet();

// Map Block instances to block data.
const _mapToBlockData = (
    blocks: immutable.Seq<number, Interfaces.IBlock>,
): immutable.Seq<number, Interfaces.IBlockData> =>
    blocks.map(block => ({ ...block.data, transactions: block.transactions.map(tx => tx.data) }));

/**
 * Represents an in-memory storage for state machine data.
 */
export class StateStorage implements Blockchain.IStateStorage {
    public blockchain: any;
    public lastDownloadedBlock: Interfaces.IBlock | null;
    public blockPing: any;
    public started: boolean;
    public forkedBlock: Interfaces.IBlock | null;
    public wakeUpTimeout: any;
    public noBlockCounter: number;
    public p2pUpdateCounter: number;
    public numberOfBlocksToRollback: number | null;
    public networkStart: boolean;

    constructor() {
        this.reset();
    }

    /**
     * Resets the state.
     */
    public reset(): void {
        this.blockchain = blockchainMachine.initialState;
        this.lastDownloadedBlock = null;
        this.blockPing = null;
        this.started = false;
        this.forkedBlock = null;
        this.wakeUpTimeout = null;
        this.noBlockCounter = 0;
        this.p2pUpdateCounter = 0;
        this.networkStart = false;
        this.numberOfBlocksToRollback = null;

        this.clear();
    }

    /**
     * Clear last blocks.
     */
    public clear(): void {
        _lastBlocks = _lastBlocks.clear();
        _cachedTransactionIds = _cachedTransactionIds.clear();
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
     * Get the last block.
     */
    public getLastBlock(): Interfaces.IBlock | null {
        return _lastBlocks.last() || null;
    }

    /**
     * Sets the last block.
     */
    public setLastBlock(block: Interfaces.IBlock): void {
        // Only keep blocks which are below the new block height (i.e. rollback)
        if (_lastBlocks.last() && _lastBlocks.last<Interfaces.IBlock>().data.height !== block.data.height - 1) {
            assert(block.data.height - 1 <= _lastBlocks.last<Interfaces.IBlock>().data.height);
            _lastBlocks = _lastBlocks.filter(b => b.data.height < block.data.height);
        }

        _lastBlocks = _lastBlocks.set(block.data.height, block);
        Managers.configManager.setHeight(block.data.height);
        Transactions.TransactionRegistry.updateStaticFees(block.data.height);

        // Delete oldest block if size exceeds the maximum
        if (_lastBlocks.size > app.resolveOptions("blockchain").state.maxLastBlocks) {
            _lastBlocks = _lastBlocks.delete(_lastBlocks.first<Interfaces.IBlock>().data.height);
        }
    }

    /**
     * Get the last blocks.
     */
    public getLastBlocks(): Interfaces.IBlock[] {
        return _lastBlocks
            .valueSeq()
            .reverse()
            .toArray();
    }

    /**
     * Get the last blocks data.
     */
    public getLastBlocksData(): immutable.Seq<number, Interfaces.IBlockData> {
        return _mapToBlockData(_lastBlocks.valueSeq().reverse());
    }

    /**
     * Get the last block ids.
     */
    public getLastBlockIds(): string[] {
        return _lastBlocks
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

        const blocks = _lastBlocks.valueSeq().filter(block => block.data.height >= start && block.data.height <= end);

        return _mapToBlockData(blocks).toArray() as Interfaces.IBlockData[];
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
            if (_cachedTransactionIds.has(tx.id)) {
                notAdded.push(tx);
                return false;
            }
            return true;
        });

        _cachedTransactionIds = _cachedTransactionIds.withMutations(cache => {
            added.forEach(tx => cache.add(tx.id));
        });

        // Cap the Set of last transaction ids to maxLastTransactionIds
        const limit = app.resolveOptions("blockchain").state.maxLastTransactionIds;
        if (_cachedTransactionIds.size > limit) {
            _cachedTransactionIds = _cachedTransactionIds.takeLast(limit);
        }

        return { added, notAdded };
    }

    /**
     * Remove the given transaction ids from the cache.
     */
    public removeCachedTransactionIds(transactionIds: string[]): void {
        _cachedTransactionIds = _cachedTransactionIds.subtract(transactionIds);
    }

    /**
     * Get cached transaction ids.
     */
    public getCachedTransactionIds(): string[] {
        return _cachedTransactionIds.toArray();
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
        // logging for stats about network health
        if (this.blockPing) {
            logger.info(
                `Block ${this.blockPing.block.height.toLocaleString()} pinged blockchain ${this.blockPing.count} times`,
            );
        }

        this.blockPing = {
            count: fromForger ? 0 : 1, // if block comes from forger, it hasn't "pinged" blockchain even once
            first: new Date().getTime(),
            last: new Date().getTime(),
            block,
        };
    }
}

export const stateStorage = Object.seal(new StateStorage());
