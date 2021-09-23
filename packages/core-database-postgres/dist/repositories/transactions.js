"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const crypto_1 = require("@arkecosystem/crypto");
const dayjs_1 = __importDefault(require("dayjs"));
const lodash_partition_1 = __importDefault(require("lodash.partition"));
const models_1 = require("../models");
const queries_1 = require("../queries");
const repository_1 = require("./repository");
class TransactionsRepository extends repository_1.Repository {
    async search(parameters) {
        if (!parameters.paginate) {
            parameters.paginate = {
                limit: 100,
                offset: 0,
            };
        }
        const selectQuery = this.query.select().from(this.query);
        const selectQueryCount = this.query.select(this.query.count().as("cnt")).from(this.query);
        const params = parameters.parameters;
        if (params.length) {
            // Special handling when called for `/wallets/transactions` endpoint
            let walletAddress;
            let walletPublicKey;
            // 'search' doesn't support custom-op 'ownerId' like 'findAll' can
            const ops = params.filter(value => {
                if (value.field === "walletAddress") {
                    walletAddress = value.value;
                }
                else if (value.field === "walletPublicKey") {
                    walletPublicKey = value.value;
                }
                return value.operator !== core_interfaces_1.Database.SearchOperator.OP_CUSTOM;
            });
            const [participants, rest] = lodash_partition_1.default(ops, op => ["sender_public_key", "recipient_id"].includes(this.propToColumnName(op.field)));
            if (participants.length > 0) {
                const [first, last] = participants;
                for (const query of [selectQuery, selectQueryCount]) {
                    query.where(this.query[this.propToColumnName(first.field)][first.operator](first.value));
                }
                if (last) {
                    const usesInOperator = participants.every(condition => condition.operator === core_interfaces_1.Database.SearchOperator.OP_IN);
                    if (usesInOperator) {
                        for (const query of [selectQuery, selectQueryCount]) {
                            query.or(this.query[this.propToColumnName(last.field)][last.operator](last.value));
                        }
                    }
                    else {
                        // This search is 1 `senderPublicKey` and 1 `recipientId`
                        for (const query of [selectQuery, selectQueryCount]) {
                            query.and(this.query[this.propToColumnName(last.field)][last.operator](last.value));
                        }
                    }
                }
                else if (first.field === "recipientId" && first.operator === core_interfaces_1.Database.SearchOperator.OP_EQ) {
                    // Workaround to include transactions (e.g. type 2) where the recipient_id is missing in the database
                    const walletManager = core_container_1.app.resolvePlugin("database")
                        .walletManager;
                    const recipientWallet = walletManager.findByAddress(first.value);
                    for (const query of [selectQuery, selectQueryCount]) {
                        query
                            .or(this.query.sender_public_key
                            .equals(recipientWallet.publicKey)
                            .and(this.query.recipient_id.isNull()))
                            .or(
                        // Include multipayment recipients
                        this.query.type
                            .equals(crypto_1.Enums.TransactionType.MultiPayment)
                            .and(this.query.type_group.equals(crypto_1.Enums.TransactionTypeGroup.Core))
                            .and(this.query.asset.contains({
                            payments: [
                                {
                                    recipientId: first.value,
                                },
                            ],
                        })));
                    }
                }
            }
            else if (rest.length) {
                const first = rest.shift();
                for (const query of [selectQuery, selectQueryCount]) {
                    query.where(this.query[this.propToColumnName(first.field)][first.operator](first.value));
                }
            }
            if (walletAddress) {
                const useWhere = !selectQuery.nodes.some(node => node.type === "WHERE");
                for (const query of [selectQuery, selectQueryCount]) {
                    let condition = this.query.recipient_id.equals(walletAddress).or(
                    // Include multipayment recipients
                    this.query.type
                        .equals(crypto_1.Enums.TransactionType.MultiPayment)
                        .and(this.query.type_group.equals(crypto_1.Enums.TransactionTypeGroup.Core))
                        .and(this.query.asset.contains({
                        payments: [
                            {
                                recipientId: walletAddress,
                            },
                        ],
                    })));
                    // We do not know public key for cold wallets
                    if (walletPublicKey) {
                        condition = condition.or(this.query.sender_public_key.equals(walletPublicKey));
                    }
                    query[useWhere ? "where" : "and"](condition);
                }
            }
            for (const condition of rest) {
                for (const query of [selectQuery, selectQueryCount]) {
                    query.and(this.query[this.propToColumnName(condition.field)][condition.operator](condition.value));
                }
            }
        }
        return this.findManyWithCount(selectQuery, selectQueryCount, parameters.paginate, parameters.orderBy);
    }
    async findById(id) {
        return this.db.oneOrNone(queries_1.queries.transactions.findById, { id });
    }
    async findByBlockId(id) {
        return this.db.manyOrNone(queries_1.queries.transactions.findByBlock, { id });
    }
    async latestByBlock(id) {
        return this.db.manyOrNone(queries_1.queries.transactions.latestByBlock, { id });
    }
    async latestByBlocks(ids) {
        return this.db.manyOrNone(queries_1.queries.transactions.latestByBlocks, { ids });
    }
    async getCountOfType(type, typeGroup = crypto_1.Enums.TransactionTypeGroup.Core) {
        return +(await this.db.one(queries_1.queries.stateBuilder.countType, { typeGroup, type })).count;
    }
    async getAssetsByType(type, typeGroup, limit, offset) {
        return this.db.manyOrNone(queries_1.queries.stateBuilder.assetsByType, { typeGroup, type, limit, offset });
    }
    async getReceivedTransactions() {
        return this.db.many(queries_1.queries.stateBuilder.receivedTransactions);
    }
    async getSentTransactions() {
        return this.db.many(queries_1.queries.stateBuilder.sentTransactions);
    }
    async forged(ids) {
        return this.db.manyOrNone(queries_1.queries.transactions.forged, { ids });
    }
    async getOpenHtlcLocks() {
        return this.db.manyOrNone(queries_1.queries.stateBuilder.openLocks);
    }
    async getRefundedHtlcLocks() {
        return this.db.manyOrNone(queries_1.queries.stateBuilder.refundedLocks);
    }
    async getClaimedHtlcLocks() {
        return this.db.manyOrNone(queries_1.queries.stateBuilder.claimedLocks);
    }
    async findByHtlcLocks(lockIds) {
        return this.db.manyOrNone(queries_1.queries.transactions.findByHtlcLocks, { ids: lockIds });
    }
    async statistics() {
        return this.db.one(queries_1.queries.transactions.statistics);
    }
    async deleteByBlockId(ids, db) {
        return db.none(queries_1.queries.transactions.deleteByBlock, { ids });
    }
    async getFeeStatistics(days, minFee) {
        minFee = minFee || 0;
        const age = crypto_1.Crypto.Slots.getTime(dayjs_1.default()
            .subtract(days, "day")
            .valueOf());
        return this.db.manyOrNone(queries_1.queries.transactions.feeStatistics, { age, minFee });
    }
    getModel() {
        return new models_1.Transaction(this.pgp);
    }
}
exports.TransactionsRepository = TransactionsRepository;
//# sourceMappingURL=transactions.js.map