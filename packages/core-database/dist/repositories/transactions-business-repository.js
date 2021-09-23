"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const crypto_1 = require("@arkecosystem/crypto");
const search_parameter_converter_1 = require("./utils/search-parameter-converter");
class TransactionsBusinessRepository {
    constructor(databaseServiceProvider) {
        this.databaseServiceProvider = databaseServiceProvider;
    }
    async search(params = {}, sequenceOrder = "desc") {
        try {
            const result = await this.databaseServiceProvider().connection.transactionsRepository.search(this.parseSearchParameters(params, sequenceOrder));
            result.rows = await this.mapBlocksToTransactions(result.rows);
            return result;
        }
        catch (e) {
            return { rows: [], count: 0 };
        }
    }
    async allVotesBySender(senderPublicKey, parameters = {}) {
        return this.search({
            ...{ senderPublicKey, type: crypto_1.Enums.TransactionType.Vote, typeGroup: crypto_1.Enums.TransactionTypeGroup.Core },
            ...parameters,
        });
    }
    async findAllByBlock(blockId, parameters = {}) {
        return this.search({ blockId, ...parameters }, "asc");
    }
    async findAllByRecipient(recipientId, parameters = {}) {
        return this.search({ recipientId, ...parameters });
    }
    async findAllBySender(senderPublicKey, parameters = {}) {
        return this.search({ senderPublicKey, ...parameters });
    }
    async findAllByType(type, parameters = {}) {
        return this.search({ type, ...parameters });
    }
    // @TODO: simplify this
    async findById(id) {
        return (await this.mapBlocksToTransactions(await this.databaseServiceProvider().connection.transactionsRepository.findById(id)))[0];
    }
    async findByTypeAndId(type, id) {
        const results = await this.search({ type, id });
        return results.rows.length ? results.rows[0] : undefined;
    }
    async getFeeStatistics(days) {
        return this.databaseServiceProvider().connection.transactionsRepository.getFeeStatistics(days, core_container_1.app.resolveOptions("transaction-pool").dynamicFees.minFeeBroadcast);
    }
    async getCountOfType(type, typeGroup) {
        return this.databaseServiceProvider().connection.transactionsRepository.getCountOfType(type, typeGroup);
    }
    async getAssetsByType(type, typeGroup, limit, offset) {
        return this.databaseServiceProvider().connection.transactionsRepository.getAssetsByType(type, typeGroup, limit, offset);
    }
    async getReceivedTransactions() {
        return this.databaseServiceProvider().connection.transactionsRepository.getReceivedTransactions();
    }
    async getSentTransactions() {
        return this.databaseServiceProvider().connection.transactionsRepository.getSentTransactions();
    }
    async getOpenHtlcLocks() {
        return this.databaseServiceProvider().connection.transactionsRepository.getOpenHtlcLocks();
    }
    async getRefundedHtlcLocks() {
        return this.databaseServiceProvider().connection.transactionsRepository.getRefundedHtlcLocks();
    }
    async getClaimedHtlcLocks() {
        return this.databaseServiceProvider().connection.transactionsRepository.getClaimedHtlcLocks();
    }
    async findByHtlcLocks(lockIds) {
        return this.mapBlocksToTransactions(await this.databaseServiceProvider().connection.transactionsRepository.findByHtlcLocks(lockIds));
    }
    getPublicKeyFromAddress(senderId) {
        const { walletManager } = this.databaseServiceProvider();
        return walletManager.hasByAddress(senderId) ? walletManager.findByAddress(senderId).publicKey : undefined;
    }
    async mapBlocksToTransactions(rows) {
        if (!Array.isArray(rows)) {
            rows = rows ? [rows] : [];
        }
        // 1. get heights from cache
        const missingFromCache = [];
        for (let i = 0; i < rows.length; i++) {
            const cachedBlock = this.getCachedBlock(rows[i].blockId);
            if (cachedBlock) {
                rows[i].block = cachedBlock;
            }
            else {
                missingFromCache.push({
                    index: i,
                    blockId: rows[i].blockId,
                });
            }
        }
        // 2. get uncached blocks from database
        if (missingFromCache.length) {
            const blocksRepository = this.databaseServiceProvider().connection.blocksRepository;
            const result = await blocksRepository.findByIds(missingFromCache.map(d => d.blockId));
            for (const missing of missingFromCache) {
                const block = result.find(item => item.id === missing.blockId);
                if (block) {
                    rows[missing.index].block = block;
                    this.cacheBlock(block);
                }
            }
        }
        return rows;
    }
    getCachedBlock(blockId) {
        // TODO: Improve caching mechanism. Would be great if we have the caching directly linked to the data-layer repos.
        // Such that when you try to fetch a block, it'll transparently check the cache first, before querying db.
        const height = this.databaseServiceProvider().cache.get(`heights:${blockId}`);
        return height ? { height, id: blockId } : undefined;
    }
    cacheBlock({ id, height }) {
        this.databaseServiceProvider().cache.set(`heights:${id}`, height);
    }
    parseSearchParameters(params, sequenceOrder = "desc") {
        const databaseService = this.databaseServiceProvider();
        if (params.type !== undefined && params.typeGroup === undefined) {
            params.typeGroup = crypto_1.Enums.TransactionTypeGroup.Core;
        }
        if (params.senderId) {
            const senderPublicKey = this.getPublicKeyFromAddress(params.senderId);
            if (!senderPublicKey) {
                throw new Error(`Invalid senderId:${params.senderId}`);
            }
            delete params.senderId;
            params.senderPublicKey = senderPublicKey;
        }
        if (params.addresses) {
            if (!params.recipientId) {
                params.recipientId = params.addresses;
            }
            if (!params.senderPublicKey) {
                params.senderPublicKey = params.addresses.map(address => {
                    return this.getPublicKeyFromAddress(address);
                });
            }
            delete params.addresses;
        }
        const searchParameters = new search_parameter_converter_1.SearchParameterConverter(databaseService.connection.transactionsRepository.getModel()).convert(params);
        if (!searchParameters.paginate) {
            searchParameters.paginate = {
                offset: 0,
                limit: 100,
            };
        }
        if (!searchParameters.orderBy.length) {
            searchParameters.orderBy.push({
                field: "timestamp",
                direction: "desc",
            });
        }
        searchParameters.orderBy.push({
            field: "sequence",
            direction: sequenceOrder,
        });
        return searchParameters;
    }
}
exports.TransactionsBusinessRepository = TransactionsBusinessRepository;
//# sourceMappingURL=transactions-business-repository.js.map