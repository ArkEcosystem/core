import { Database } from "@arkecosystem/core-interfaces";
import { Enums } from "@arkecosystem/crypto";
import partition from "lodash.partition";
import snakeCase from "lodash.snakecase";
import { IRepository } from "../interfaces";
import { Repository } from "./repository";
import { buildFilterQuery } from "./utils/build-filter-query";

// TODO: Deprecate this with v1
export class TransactionsRepository extends Repository implements IRepository {
    public async findAll(parameters: any = {}, sequenceOrder: "asc" | "desc" = "desc"): Promise<any> {
        const selectQuery = this.query.select().from(this.query);

        if (parameters.senderId) {
            const senderPublicKey = this.__publicKeyFromAddress(parameters.senderId);

            if (!senderPublicKey) {
                return { rows: [], count: 0 };
            }

            parameters.senderPublicKey = senderPublicKey;
        }

        const conditions = Object.entries(this._formatConditions(parameters));

        if (conditions.length) {
            const first = conditions.shift();

            selectQuery.where(this.query[first[0]].equals(first[1]));

            for (const condition of conditions) {
                selectQuery.and(this.query[condition[0]].equals(condition[1]));
            }
        }

        if (parameters.ownerId) {
            const owner = this.databaseService.walletManager.findByAddress(parameters.ownerId);

            selectQuery.and(this.query.sender_public_key.equals(owner.publicKey));
            selectQuery.or(this.query.recipient_id.equals(owner.address));
        }

        this.__orderBy(selectQuery, parameters, sequenceOrder);

        const results = await this._findManyWithCount(selectQuery, {
            limit: parameters.limit,
            offset: parameters.offset,
            orderBy: undefined,
        });

        results.rows = await this.__mapBlocksToTransactions(results.rows);

        return results;
    }

    public async findAllLegacy(parameters: any = {}): Promise<any> {
        const selectQuery = this.query
            .select(this.query.id, this.query.block_id, this.query.serialized, this.query.timestamp)
            .from(this.query);

        if (parameters.senderId) {
            parameters.senderPublicKey = this.__publicKeyFromAddress(parameters.senderId);
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

        applyConditions([selectQuery]);

        this.__orderBy(selectQuery, parameters);

        const results = await this._findManyWithCount(selectQuery, {
            limit: parameters.limit,
            offset: parameters.offset,
            orderBy: undefined,
        });

        results.rows = await this.__mapBlocksToTransactions(results.rows);

        return results;
    }

    public async findAllByWallet(
        wallet: Database.IWallet,
        parameters: any = {},
    ): Promise<Database.ITransactionsPaginated> {
        const selectQuery = this.query
            .select(this.query.id, this.query.block_id, this.query.serialized, this.query.timestamp)
            .from(this.query);

        const applyConditions = queries => {
            for (const item of queries) {
                item.where(this.query.sender_public_key.equals(wallet.publicKey)).or(
                    this.query.recipient_id.equals(wallet.address),
                );
            }
        };

        applyConditions([selectQuery]);

        this.__orderBy(selectQuery, parameters);

        const results = await this._findManyWithCount(selectQuery, {
            limit: parameters.limit,
            offset: parameters.offset,
            orderBy: undefined,
        });

        results.rows = await this.__mapBlocksToTransactions(results.rows);

        return results;
    }

    public async findAllBySender(senderPublicKey, parameters: any = {}): Promise<any> {
        return this.findAll({ ...{ senderPublicKey }, ...parameters });
    }

    public async findAllByRecipient(recipientId, parameters: any = {}): Promise<any> {
        return this.findAll({ ...{ recipientId }, ...parameters });
    }

    public async allVotesBySender(senderPublicKey, parameters: any = {}): Promise<any> {
        return this.findAll({
            ...{ senderPublicKey, type: Enums.TransactionTypes.Vote },
            ...parameters,
        });
    }

    public async findAllByBlock(blockId, parameters: any = {}): Promise<any> {
        return this.findAll({ ...{ blockId }, ...parameters }, "asc");
    }

    public async findAllByType(type, parameters: any = {}): Promise<any> {
        return this.findAll({ ...{ type }, ...parameters });
    }

    public async findById(id): Promise<any> {
        const query = this.query
            .select(this.query.id, this.query.block_id, this.query.serialized, this.query.timestamp)
            .from(this.query)
            .where(this.query.id.equals(id));

        const transaction = await this._find(query);

        return this.__mapBlocksToTransactions(transaction);
    }

    public async findByTypeAndId(type, id): Promise<any> {
        const query = this.query
            .select(this.query.id, this.query.block_id, this.query.serialized, this.query.timestamp)
            .from(this.query)
            .where(this.query.id.equals(id).and(this.query.type.equals(type)));

        const transaction = await this._find(query);

        return this.__mapBlocksToTransactions(transaction);
    }

    public async findByIds(ids): Promise<any> {
        const query = this.query
            .select(this.query.id, this.query.block_id, this.query.serialized, this.query.timestamp)
            .from(this.query)
            .where(this.query.id.in(ids));

        return this._findMany(query);
    }

    /**
     * Search all transactions.
     *
     * @param  {Object} parameters
     * @param  {Number} [parameters.limit] - Limit the number of results
     * @param  {Number} [parameters.offset] - Skip some results
     * @param  {Array}  [parameters.orderBy] - Order of the results
     * @param  {String} [parameters.id] - Search by transaction id
     * @param  {String} [parameters.blockId] - Search by block id
     * @param  {String} [parameters.recipientId] - Search by recipient address
     * @param  {String} [parameters.senderPublicKey] - Search by sender public key
     * @param  {String} [parameters.senderId] - Search by sender address
     * @param  {Array}  [parameters.addresses] - Search by senders or recipients addresses
     * @param  {Number} [parameters.type] - Search by transaction type
     * @param  {Number} [parameters.version] - Search by transaction version
     * @param  {Object} [parameters.timestamp] - Search by transaction date
     * @param  {Number} [parameters.timestamp.from] - Since date
     * @param  {Number} [parameters.timestamp.to] - Until date
     * @param  {Object} [parameters.amount] - Search by transaction amount
     * @param  {Number} [parameters.amount.from] - From amount
     * @param  {Number} [parameters.amount.to] - To date
     * @param  {Object} [parameters.fee] - Search by transaction fee
     * @param  {Number} [parameters.fee.from] - From fee
     * @param  {Number} [parameters.fee.to] - To fee
     * @return {Object}
     */
    public async search(parameters): Promise<any> {
        const selectQuery = this.query.select().from(this.query);

        const filters = {
            exact: ["id", "block_id", "type", "version"],
            between: ["timestamp", "amount", "fee"],
            wildcard: ["vendor_field_hex"],
            in: [],
        };

        if (parameters.senderId) {
            const senderPublicKey = this.__publicKeyFromAddress(parameters.senderId);

            if (senderPublicKey) {
                parameters.senderPublicKey = senderPublicKey;
            } else {
                return { count: 0, rows: [] };
            }
        }

        if (parameters.recipientId) {
            filters.exact.push("recipient_id");
        }
        if (parameters.senderPublicKey) {
            filters.exact.push("sender_public_key");
        }

        // When both participants, sender and recipient, are provided, searching by addresses is not useful
        if (parameters.addresses) {
            if (!parameters.recipientId) {
                filters.in.push("recipient_id");
                parameters.recipientId = parameters.addresses;
            }
            if (!parameters.senderPublicKey) {
                filters.in.push("sender_public_key");
                parameters.senderPublicKey = parameters.addresses.map(address => {
                    return this.__publicKeyFromAddress(address);
                });
            }
        }

        const conditions = buildFilterQuery(this._formatConditions(parameters), filters);

        /*
         * Searching by `addresses` could create queries:
         *  - 1 `senderPublicKey` AND n `recipientId`
         *  - n `senderPublicKey` AND 1 `recipientId`.
         *  - n `senderPublicKey` OR n `recipientId`.
         */
        if (conditions.length) {
            const [participants, rest] = partition(conditions, condition => {
                return ["sender_public_key", "recipient_id"].indexOf(condition.column) > -1;
            });

            if (participants.length > 0) {
                const [first, last] = participants;
                selectQuery.where(this.query[first.column][first.method](first.value));

                if (last) {
                    const usesInOperator = participants.every(condition => condition.method === "in");
                    if (usesInOperator) {
                        selectQuery.or(this.query[last.column][last.method](last.value));
                    } else {
                        // This search is 1 `senderPublicKey` and 1 `recipientId`
                        selectQuery.and(this.query[last.column][last.method](last.value));
                    }
                }
            } else if (rest.length) {
                const first = rest.shift();
                selectQuery.where(this.query[first.column][first.method](first.value));
            }

            for (const condition of rest) {
                selectQuery.and(this.query[condition.column][condition.method](condition.value));
            }
        }

        this.__orderBy(selectQuery, parameters);

        const results = await this._findManyWithCount(selectQuery, {
            limit: parameters.limit || 100,
            offset: parameters.offset || 0,
            orderBy: undefined,
        });

        results.rows = await this.__mapBlocksToTransactions(results.rows);

        return results;
    }

    public getModel(): object {
        return (this.databaseService.connection as any).models.transaction;
    }

    /**
     * [__mapBlocksToTransactions description]
     * @param  {Array|Object} data
     * @return {Object}
     */
    public async __mapBlocksToTransactions(data): Promise<any> {
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
     * @return {Object|undefined}
     */
    public __getBlockCache(blockId): any {
        const height = this.cache.get(`heights:${blockId}`);

        return height ? { height, id: blockId } : undefined;
    }

    /**
     * Stores the height of the block on the cache
     * @param  {Object} block
     * @param  {String} block.id
     * @param  {Number} block.height
     */
    public __setBlockCache({ id, height }): void {
        this.cache.set(`heights:${id}`, height);
    }

    /**
     * Retrieves the publicKey of the address from the WalletManager in-memory data
     * @param {String} senderId
     * @return {String}
     */
    public __publicKeyFromAddress(senderId): string {
        if (this.databaseService.walletManager.has(senderId)) {
            return this.databaseService.walletManager.findByAddress(senderId).publicKey;
        }

        return undefined;
    }

    public __orderBy(selectQuery, parameters, sequenceOrder: "asc" | "desc" = "desc"): void {
        const orderBy = parameters.orderBy
            ? parameters.orderBy.split(":").map(p => p.toLowerCase())
            : ["timestamp", "desc"];

        selectQuery.order(this.query[snakeCase(orderBy[0])][orderBy[1]]);

        selectQuery.order(this.query.sequence[sequenceOrder]);
    }
}
