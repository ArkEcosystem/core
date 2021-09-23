"use strict";
// tslint:disable:variable-name
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const crypto_1 = require("@arkecosystem/crypto");
const assert_1 = __importDefault(require("assert"));
const immutable_1 = require("immutable");
/**
 * @TODO
 * - extract block and transaction behaviours into their respective stores
 */
class StateStore {
    constructor() {
        // @TODO: make all properties private and expose them one-by-one through a getter if used outside of this class
        this.blockchain = {};
        this.genesisBlock = undefined;
        this.lastDownloadedBlock = undefined;
        this.blockPing = undefined;
        this.started = false;
        this.forkedBlock = undefined;
        this.wakeUpTimeout = undefined;
        this.noBlockCounter = 0;
        this.p2pUpdateCounter = 0;
        this.numberOfBlocksToRollback = undefined;
        this.networkStart = false;
        // Stores the last n blocks in ascending height. The amount of last blocks
        // can be configured with the option `state.maxLastBlocks`.
        this.lastBlocks = immutable_1.OrderedMap();
        // Stores the last n incoming transaction ids. The amount of transaction ids
        // can be configred with the option `state.maxLastTransactionIds`.
        this.cachedTransactionIds = immutable_1.OrderedSet();
    }
    /**
     * Resets the state.
     * @TODO: remove the need for this method.
     */
    reset(blockchainMachine) {
        this.blockchain = blockchainMachine.initialState;
    }
    /**
     * Clear last blocks.
     */
    clear() {
        this.lastBlocks = this.lastBlocks.clear();
        this.cachedTransactionIds = this.cachedTransactionIds.clear();
    }
    /**
     * Clear check later timeout.
     */
    clearWakeUpTimeout() {
        if (this.wakeUpTimeout) {
            clearTimeout(this.wakeUpTimeout);
            this.wakeUpTimeout = undefined;
        }
    }
    /**
     * Get the last block height.
     */
    getLastHeight() {
        return this.getLastBlock().data.height;
    }
    /**
     * Get the genesis block.
     */
    getGenesisBlock() {
        return this.genesisBlock;
    }
    /**
     * Sets the genesis block.
     */
    setGenesisBlock(block) {
        this.genesisBlock = block;
    }
    /**
     * Get the last block.
     */
    getLastBlock() {
        return this.lastBlocks.last() || undefined;
    }
    /**
     * Sets the last block.
     */
    setLastBlock(block) {
        // Only keep blocks which are below the new block height (i.e. rollback)
        if (this.lastBlocks.last() && this.lastBlocks.last().data.height !== block.data.height - 1) {
            assert_1.default(block.data.height - 1 <= this.lastBlocks.last().data.height);
            this.lastBlocks = this.lastBlocks.filter(b => b.data.height < block.data.height);
        }
        this.lastBlocks = this.lastBlocks.set(block.data.height, block);
        crypto_1.Managers.configManager.setHeight(block.data.height);
        if (crypto_1.Managers.configManager.isNewMilestone()) {
            core_container_1.app.resolvePlugin("event-emitter").emit(core_event_emitter_1.ApplicationEvents.InternalMilestoneChanged);
        }
        // Delete oldest block if size exceeds the maximum
        if (this.lastBlocks.size > core_container_1.app.resolveOptions("state").storage.maxLastBlocks) {
            this.lastBlocks = this.lastBlocks.delete(this.lastBlocks.first().data.height);
        }
        this.noBlockCounter = 0;
        this.p2pUpdateCounter = 0;
    }
    /**
     * Get the last blocks.
     */
    getLastBlocks() {
        return this.lastBlocks
            .valueSeq()
            .reverse()
            .toArray();
    }
    /**
     * Get the last blocks data.
     */
    getLastBlocksData(headersOnly) {
        return this.mapToBlockData(this.lastBlocks.valueSeq().reverse(), headersOnly);
    }
    /**
     * Get the last block ids.
     */
    getLastBlockIds() {
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
    getLastBlocksByHeight(start, end, headersOnly) {
        end = end || start;
        const blocks = this.lastBlocks
            .valueSeq()
            .filter(block => block.data.height >= start && block.data.height <= end);
        return this.mapToBlockData(blocks, headersOnly).toArray();
    }
    /**
     * Get common blocks for the given IDs.
     */
    getCommonBlocks(ids) {
        const idsHash = {};
        for (const id of ids) {
            idsHash[id] = true;
        }
        return this.getLastBlocksData(true)
            .filter(block => idsHash[block.id])
            .toArray();
    }
    /**
     * Cache the ids of the given transactions.
     */
    cacheTransactions(transactions) {
        const notAdded = [];
        const added = transactions.filter(tx => {
            if (this.cachedTransactionIds.has(tx.id)) {
                notAdded.push(tx);
                return false;
            }
            return true;
        });
        this.cachedTransactionIds = this.cachedTransactionIds.withMutations(cache => {
            for (const tx of added) {
                cache.add(tx.id);
            }
        });
        // Cap the Set of last transaction ids to maxLastTransactionIds
        const limit = core_container_1.app.resolveOptions("state").storage.maxLastTransactionIds;
        if (this.cachedTransactionIds.size > limit) {
            this.cachedTransactionIds = this.cachedTransactionIds.takeLast(limit);
        }
        return { added, notAdded };
    }
    /**
     * Drop all cached transaction ids.
     */
    clearCachedTransactionIds() {
        this.cachedTransactionIds = this.cachedTransactionIds.clear();
    }
    /**
     * Get cached transaction ids.
     */
    getCachedTransactionIds() {
        return this.cachedTransactionIds.toArray();
    }
    /**
     * Ping a block.
     */
    pingBlock(incomingBlock) {
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
    pushPingBlock(block, fromForger = false) {
        if (this.blockPing) {
            core_container_1.app.resolvePlugin("logger").info(`Previous block ${this.blockPing.block.height.toLocaleString()} pinged blockchain ${this.blockPing.count} times`);
        }
        this.blockPing = {
            count: fromForger ? 0 : 1,
            first: new Date().getTime(),
            last: new Date().getTime(),
            block,
        };
    }
    // Map Block instances to block data.
    mapToBlockData(blocks, headersOnly) {
        return blocks.map(block => ({
            ...block.data,
            transactions: headersOnly ? undefined : block.transactions.map(tx => tx.data),
        }));
    }
}
exports.StateStore = StateStore;
//# sourceMappingURL=state.js.map