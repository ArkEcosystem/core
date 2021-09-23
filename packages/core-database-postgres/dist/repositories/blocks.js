"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const models_1 = require("../models");
const queries_1 = require("../queries");
const repository_1 = require("./repository");
class BlocksRepository extends repository_1.Repository {
    async search(params) {
        // TODO: we're selecting all the columns right now. Add support for choosing specific columns, when it proves useful.
        const selectQuery = this.query.select().from(this.query);
        const selectQueryCount = this.query.select(this.query.count().as("cnt")).from(this.query);
        // Blocks repo atm, doesn't search using any custom parameters
        const parameterList = params.parameters.filter(o => o.operator !== core_interfaces_1.Database.SearchOperator.OP_CUSTOM);
        if (parameterList.length) {
            let first;
            do {
                first = parameterList.shift();
                // ignore params whose operator is unknown
            } while (!first.operator && parameterList.length);
            if (first) {
                for (const query of [selectQuery, selectQueryCount]) {
                    query.where(this.query[this.propToColumnName(first.field)][first.operator](first.value));
                }
                for (const param of parameterList) {
                    for (const query of [selectQuery, selectQueryCount]) {
                        query.and(this.query[this.propToColumnName(param.field)][param.operator](param.value));
                    }
                }
            }
        }
        return this.findManyWithCount(selectQuery, selectQueryCount, params.paginate, params.orderBy);
    }
    async findById(id) {
        return this.db.oneOrNone(queries_1.queries.blocks.findById, { id });
    }
    async findByIds(ids) {
        return this.findMany(this.query
            .select()
            .from(this.query)
            .where(this.query.id.in(ids))
            .group(this.query.id));
    }
    async findByHeight(height) {
        return this.db.oneOrNone(queries_1.queries.blocks.findByHeight, { height });
    }
    async findByHeights(heights) {
        return this.db.manyOrNone(queries_1.queries.blocks.findByHeights, { heights });
    }
    async count() {
        return (await this.db.one(queries_1.queries.blocks.count)).count;
    }
    async getBlockRewards() {
        return this.db.many(queries_1.queries.stateBuilder.blockRewards);
    }
    async getLastForgedBlocks() {
        return this.db.many(queries_1.queries.stateBuilder.lastForgedBlocks);
    }
    async getDelegatesForgedBlocks() {
        return this.db.many(queries_1.queries.stateBuilder.delegatesForgedBlocks);
    }
    async common(ids) {
        return this.db.manyOrNone(queries_1.queries.blocks.common, { ids });
    }
    async headers(start, end) {
        return this.db.many(queries_1.queries.blocks.headers, { start, end });
    }
    async heightRange(start, end) {
        return this.db.manyOrNone(queries_1.queries.blocks.heightRange, { start, end });
    }
    async heightRangeWithTransactions(start, end) {
        return this.db.manyOrNone(queries_1.queries.blocks.heightRangeWithTransactions, { start, end }).map(block => {
            if (block.transactions === null) {
                delete block.transactions;
            }
            return block;
        });
    }
    async latest() {
        return this.db.oneOrNone(queries_1.queries.blocks.latest);
    }
    async recent() {
        return this.db.many(queries_1.queries.blocks.recent);
    }
    async statistics() {
        return this.db.one(queries_1.queries.blocks.statistics);
    }
    async top(count) {
        return this.db.many(queries_1.queries.blocks.top, { top: count });
    }
    async delete(ids, db) {
        return db.none(queries_1.queries.blocks.delete, { ids });
    }
    getModel() {
        return new models_1.Block(this.pgp);
    }
}
exports.BlocksRepository = BlocksRepository;
//# sourceMappingURL=blocks.js.map