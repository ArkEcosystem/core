// tslint:disable:variable-name

import { app } from "@arkecosystem/core-container";
import { models } from "@arkecosystem/crypto";
import assert from "assert";
import immutable from "immutable";
import { config } from "./config";
import { blockchainMachine } from "./machines/blockchain";

const { Block } = models;
const logger = app.resolvePlugin("logger");

// Stores the last n blocks in ascending height. The amount of last blocks
// can be configured with the option `state.maxLastBlocks`.
let _lastBlocks: any = immutable.OrderedMap<number, typeof Block>();

// Stores the last n incoming transaction ids. The amount of transaction ids
// can be configred with the option `state.maxLastTransactionIds`.
let _cachedTransactionIds = immutable.OrderedSet();

// Map Block instances to block data.
const _mapToBlockData = blocks => blocks.map(block => ({ ...block.data, transactions: block.transactions }));

/**
 * Represents an in-memory storage for state machine data.
 */
class StateStorage {
    public blockchain: any;
    public lastDownloadedBlock: any;
    public blockPing: any;
    public started: boolean;
    public forked: boolean;
    public forkedBlock: any;
    public rebuild: boolean;
    public fastRebuild: boolean;
    public checkLaterTimeout: any;
    public noBlockCounter: number;
    public p2pUpdateCounter: number;
    public networkStart: boolean;

    constructor() {
        this.reset();
    }

    /**
     * Resets the state.
     * @returns {void}
     */
    public reset() {
        this.blockchain = blockchainMachine.initialState;
        this.lastDownloadedBlock = null;
        this.blockPing = null;
        this.started = false;
        this.forked = false;
        this.forkedBlock = null;
        this.rebuild = true;
        this.fastRebuild = false;
        this.checkLaterTimeout = null;
        this.noBlockCounter = 0;
        this.p2pUpdateCounter = 0;
        this.networkStart = false;

        this.clear();
    }

    /**
     * Clear last blocks.
     * @returns {void}
     */
    public clear() {
        _lastBlocks = _lastBlocks.clear();
        _cachedTransactionIds = _cachedTransactionIds.clear();
    }

    /**
     * Clear check later timeout.
     * @returns {void}
     */
    public clearCheckLater() {
        if (this.checkLaterTimeout) {
            clearTimeout(this.checkLaterTimeout);
            this.checkLaterTimeout = null;
        }
    }

    /**
     * Get the last block.
     * @returns {Block|null}
     */
    public getLastBlock(): any {
        return _lastBlocks.last() || null;
    }

    /**
     * Sets the last block.
     * @returns {void}
     */
    public setLastBlock(block) {
        // Only keep blocks which are below the new block height (i.e. rollback)
        if (_lastBlocks.last() && _lastBlocks.last().data.height !== block.data.height - 1) {
            assert(block.data.height - 1 <= _lastBlocks.last().data.height);
            _lastBlocks = _lastBlocks.filter(b => b.data.height < block.data.height);
        }

        _lastBlocks = _lastBlocks.set(block.data.height, block);

        // Delete oldest block if size exceeds the maximum
        if (_lastBlocks.size > config.get("state.maxLastBlocks")) {
            _lastBlocks = _lastBlocks.delete(_lastBlocks.first().data.height);
        }
    }

    /**
     * Get the last blocks.
     * @returns {Array}
     */
    public getLastBlocks() {
        return _lastBlocks
            .valueSeq()
            .reverse()
            .toArray();
    }

    /**
     * Get the last blocks data.
     * @returns {Seq}
     */
    public getLastBlocksData() {
        return _mapToBlockData(_lastBlocks.valueSeq().reverse());
    }

    /**
     * Get the last block ids.
     * @returns {Array}
     */
    public getLastBlockIds() {
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
    public getLastBlocksByHeight(start, end?) {
        end = end || start;

        const blocks = _lastBlocks.valueSeq().filter(block => block.data.height >= start && block.data.height <= end);

        return _mapToBlockData(blocks).toArray();
    }

    /**
     * Get common blocks for the given IDs.
     * @returns {Array}
     */
    public getCommonBlocks(ids) {
        return this.getLastBlocksData()
            .filter(block => ids.includes(block.id))
            .toArray();
    }

    /**
     * Cache the ids of the given transactions.
     * @param {Array} transactions
     * @return Object {
     *  added: array of added transactions,
     *  notAdded: array of previously added transactions
     * }
     */
    public cacheTransactions(transactions) {
        const notAdded = [];
        const added = transactions.filter(tx => {
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
        const limit = config.get("state.maxLastTransactionIds");
        if (_cachedTransactionIds.size > limit) {
            _cachedTransactionIds = _cachedTransactionIds.takeLast(limit);
        }

        return { added, notAdded };
    }

    /**
     * Remove the given transaction ids from the cache.
     * @param {Array} transactionIds
     * @returns {void}
     */
    public removeCachedTransactionIds(transactionIds) {
        _cachedTransactionIds = _cachedTransactionIds.subtract(transactionIds);
    }

    /**
     * Get cached transaction ids.
     * @returns {Array}
     */
    public getCachedTransactionIds() {
        return _cachedTransactionIds.toArray();
    }

    /**
     * Ping a block.
     * @param {Block} incomingBlock
     * @returns {Boolean}
     */
    public pingBlock(incomingBlock) {
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
     * Push ping block
     * @param {Block} block
     * @returns {void}
     */
    public pushPingBlock(block) {
        // logging for stats about network health
        if (this.blockPing) {
            logger.info(
                `Block ${this.blockPing.block.height.toLocaleString()} pinged blockchain ${this.blockPing.count} times`,
            );
        }

        this.blockPing = {
            count: 1,
            first: new Date().getTime(),
            last: new Date().getTime(),
            block,
        };
    }
}

export const stateStorage = Object.seal(new StateStorage());
