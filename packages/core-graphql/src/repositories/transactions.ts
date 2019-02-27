import { constants, slots } from "@arkecosystem/crypto";
import { dato } from "@arkecosystem/utils";

import { Repository } from "./repository";
import { buildFilterQuery } from "./utils/filter-query";

const { TransactionTypes } = constants;

class TransactionsRepository extends Repository {
    /**
     * Get all transactions.
     * @param  {Object}  params
     * @return {Object}
     */
    public async findAll(parameters: any = {}) {
        const selectQuery = this.query.select().from(this.query);
        const countQuery = this._makeEstimateQuery();

        if (parameters.senderId) {
            const senderPublicKey = this.__publicKeyFromSenderId(parameters.senderId);

            if (!senderPublicKey) {
                return { rows: [], count: 0 };
            }

            parameters.senderPublicKey = senderPublicKey;
        }

        if (parameters.type) {
            parameters.type = TransactionTypes[parameters.type];
        }

        const applyConditions = queries => {
            const conditions = Object.entries(this._formatConditions(parameters));

            if (conditions.length) {
                const first = conditions.shift();

                for (const item of queries) {
                    item.where(this.query[first[0]].equals(first[1]));

                    for (const condition of conditions) {
                        item.and(this.query[condition[0]].equals(condition[1]));
                    }
                }
            }
        };

        applyConditions([selectQuery, countQuery]);

        const results = await this._findManyWithCount(selectQuery, countQuery, {
            limit: parameters.limit || 100,
            offset: parameters.offset || 0,
            orderBy: this.__orderBy(parameters),
        });

        results.rows = await this.__mapBlocksToTransactions(results.rows);
        return results;
    }

    /**
     * Get all transactions (LEGACY, for V1 only).
     * @param  {Object}  params
     * @return {Object}
     */
    public async findAllLegacy(parameters: any = {}) {
        const selectQuery = this.query.select(this.query.block_id, this.query.serialized).from(this.query);
        const countQuery = this._makeEstimateQuery();

        if (parameters.senderId) {
            parameters.senderPublicKey = this.__publicKeyFromSenderId(parameters.senderId);
        }

        const applyConditions = queries => {
            const conditions = Object.entries(this._formatConditions(parameters));

            if (conditions.length) {
                const first = conditions.shift();

                for (const item of queries) {
                    item.where(this.query[first[0]].equals(first[1]));

                    for (const [key, value] of conditions) {
                        item.or(this.query[key].equals(value));
                    }
                }
            }
        };

        applyConditions([selectQuery, countQuery]);

        const results = await this._findManyWithCount(selectQuery, countQuery, {
            limit: parameters.limit,
            offset: parameters.offset,
            orderBy: this.__orderBy(parameters),
        });

        results.rows = await this.__mapBlocksToTransactions(results.rows);

        return results;
    }

    /**
     * Get all transactions for the given Wallet object.
     * @param  {Wallet} wallet
     * @param  {Object} parameters
     * @return {Object}
     */
    public async findAllByWallet(wallet, parameters: any = {}) {
        const selectQuery = this.query.select(this.query.block_id, this.query.serialized).from(this.query);
        const countQuery = this._makeEstimateQuery();

        const applyConditions = queries => {
            for (const item of queries) {
                item.where(this.query.sender_public_key.equals(wallet.publicKey)).or(
                    this.query.recipient_id.equals(wallet.address),
                );
            }
        };

        applyConditions([selectQuery, countQuery]);

        const results = await this._findManyWithCount(selectQuery, countQuery, {
            limit: parameters.limit,
            offset: parameters.offset,
            orderBy: this.__orderBy(parameters),
        });

        results.rows = await this.__mapBlocksToTransactions(results.rows);

        return results;
    }

    /**
     * Get all transactions for the given sender public key.
     * @param  {String} senderPublicKey
     * @param  {Object} parameters
     * @return {Object}
     */
    public async findAllBySender(senderPublicKey, parameters = {}) {
        return this.findAll({ ...{ senderPublicKey }, ...parameters });
    }

    /**
     * Get all transactions for the given recipient address.
     * @param  {String} recipientId
     * @param  {Object} parameters
     * @return {Object}
     */
    public async findAllByRecipient(recipientId, parameters = {}) {
        return this.findAll({ ...{ recipientId }, ...parameters });
    }

    /**
     * Get all vote transactions for the given sender public key.
     * TODO rename to findAllVotesBySender or not?
     * @param  {String} senderPublicKey
     * @param  {Object} parameters
     * @return {Object}
     */
    public async allVotesBySender(senderPublicKey, parameters = {}) {
        return this.findAll({
            ...{ senderPublicKey, type: TransactionTypes.Vote },
            ...parameters,
        });
    }

    /**
     * Get all transactions for the given block.
     * @param  {Number} blockId
     * @param  {Object} parameters
     * @return {Object}
     */
    public async findAllByBlock(blockId, parameters = {}) {
        return this.findAll({ ...{ blockId }, ...parameters });
    }

    /**
     * Get all transactions for the given type.
     * @param  {Number} type
     * @param  {Object} parameters
     * @return {Object}
     */
    public async findAllByType(type, parameters = {}) {
        return this.findAll({ ...{ type }, ...parameters });
    }

    /**
     * Get a transaction.
     * @param  {Number} id
     * @return {Object}
     */
    public async findById(id) {
        const query = this.query
            .select(this.query.block_id, this.query.serialized)
            .from(this.query)
            .where(this.query.id.equals(id));

        const transaction = await this._find(query);

        return this.__mapBlocksToTransactions(transaction);
    }

    /**
     * Get a transactions for the given type and id.
     * @param  {Number} type
     * @param  {Number} id
     * @return {Object}
     */
    public async findByTypeAndId(type, id) {
        const query = this.query
            .select(this.query.block_id, this.query.serialized)
            .from(this.query)
            .where(this.query.id.equals(id).and(this.query.type.equals(type)));

        const transaction = await this._find(query);

        return this.__mapBlocksToTransactions(transaction);
    }

    /**
     * Get transactions for the given ids.
     * @param  {Array} ids
     * @return {Object}
     */
    public async findByIds(ids) {
        const query = this.query
            .select(this.query.block_id, this.query.serialized)
            .from(this.query)
            .where(this.query.id.in(ids));

        return this._findMany(query);
    }

    /**
     * Get all transactions that have a vendor field.
     * @return {Object}
     */
    public async findWithVendorField() {
        const query = this.query
            .select(this.query.block_id, this.query.serialized)
            .from(this.query)
            .where(this.query.vendor_field_hex.isNotNull());

        const rows = await this._findMany(query);

        return this.__mapBlocksToTransactions(rows);
    }

    /**
     * Calculates min, max and average fee statistics based on transactions table
     * @return {Object}
     */
    public async getFeeStatistics() {
        const query = this.query
            .select(
                this.query.type,
                this.query.fee.min("minFee"),
                this.query.fee.max("maxFee"),
                this.query.fee.avg("avgFee"),
                this.query.timestamp.max("timestamp"),
            )
            .from(this.query)
            .where(
                this.query.timestamp.gte(
                    slots.getTime(
                        dato()
                            .subtractDays(30)
                            .toMilliseconds(),
                    ),
                ),
            )
            .and(this.query.fee.gte(this.transactionPool.options.dynamicFees.minFeeBroadcast))
            .group(this.query.type)
            .order('"timestamp" DESC');

        return this._findMany(query);
    }

    /**
     * Search all transactions.
     *
     * @param  {Object} params
     * @return {Object}
     */
    public async search(parameters) {
        const selectQuery = this.query.select().from(this.query);
        const countQuery = this._makeEstimateQuery();

        if (parameters.senderId) {
            const senderPublicKey = this.__publicKeyFromSenderId(parameters.senderId);

            if (senderPublicKey) {
                parameters.senderPublicKey = senderPublicKey;
            }
        }

        const applyConditions = queries => {
            const conditions = buildFilterQuery(this._formatConditions(parameters), {
                exact: ["id", "block_id", "type", "version", "sender_public_key", "recipient_id"],
                between: ["timestamp", "amount", "fee"],
                wildcard: ["vendor_field_hex"],
            });

            if (conditions.length) {
                const first = conditions.shift();

                for (const item of queries) {
                    item.where(this.query[first.column][first.method](first.value));

                    for (const condition of conditions) {
                        item.and(this.query[condition.column][condition.method](condition.value));
                    }
                }
            }
        };

        applyConditions([selectQuery, countQuery]);

        const results = await this._findManyWithCount(selectQuery, countQuery, {
            limit: parameters.limit,
            offset: parameters.offset,
            orderBy: this.__orderBy(parameters),
        });

        results.rows = await this.__mapBlocksToTransactions(results.rows);

        return results;
    }

    public getModel() {
        return (this.databaseService.connection as any).models.transaction;
    }

    /**
     * [__mapBlocksToTransactions description]
     * @param  {Array|Object} data
     * @return {Object}
     */
    public async __mapBlocksToTransactions(data) {
        const blockQuery = (this.databaseService.connection as any).models.block.query();

        // Array...
        if (Array.isArray(data)) {
            // 1. get heights from cache
            const missingFromCache = [];

            for (let i = 0; i < data.length; i++) {
                const cachedBlock = this.__getBlockCache(data[i].blockId);

                if (cachedBlock) {
                    data[i].block = cachedBlock;
                } else {
                    missingFromCache.push({
                        index: i,
                        blockId: data[i].blockId,
                    });
                }
            }

            // 2. get missing heights from database
            if (missingFromCache.length) {
                const query = blockQuery
                    .select(blockQuery.id, blockQuery.height)
                    .from(blockQuery)
                    .where(blockQuery.id.in(missingFromCache.map(d => d.blockId)))
                    .group(blockQuery.id);

                const blocks = await this._findMany(query);

                for (const missing of missingFromCache) {
                    const block = blocks.find(item => item.id === missing.blockId);
                    if (block) {
                        data[missing.index].block = block;
                        this.__setBlockCache(block);
                    }
                }
            }

            return data;
        }

        // Object...
        if (data) {
            const cachedBlock = this.__getBlockCache(data.blockId);

            if (cachedBlock) {
                data.block = cachedBlock;
            } else {
                const query = blockQuery
                    .select(blockQuery.id, blockQuery.height)
                    .from(blockQuery)
                    .where(blockQuery.id.equals(data.blockId));

                data.block = await this._find(query);

                this.__setBlockCache(data.block);
            }
        }

        return data;
    }

    /**
     * Tries to retrieve the height of the block from the cache
     * @param  {String} blockId
     * @return {Object|null}
     */
    public __getBlockCache(blockId) {
        const height = this.cache.get(`heights:${blockId}`);

        return height ? { height, id: blockId } : null;
    }

    /**
     * Stores the height of the block on the cache
     * @param  {Object} block
     * @param  {String} block.id
     * @param  {Number} block.height
     */
    public __setBlockCache({ id, height }) {
        this.cache.set(`heights:${id}`, height);
    }

    /**
     * Retrieves the publicKey of the address from the WalletManager in-memory data
     * @param {String} senderId
     * @return {String}
     */
    public __publicKeyFromSenderId(senderId) {
        return this.databaseService.walletManager.findByAddress(senderId).publicKey;
    }

    public __orderBy(parameters) {
        return parameters.orderBy ? parameters.orderBy.split(":").map(p => p.toLowerCase()) : ["timestamp", "desc"];
    }
}

export const transactionRepository = new TransactionsRepository();
