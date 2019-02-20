import { Database } from "@arkecosystem/core-interfaces";
import { Block } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

const { blocks: sql } = queries;

export class BlocksRepository extends Repository implements Database.IBlocksRepository {
    /**
     * Find a block by its ID.
     * @param  {Number} id
     * @return {Promise}
     */
    public async findById(id) {
        return this.db.oneOrNone(sql.findById, { id });
    }

    public async findByIds(ids: string[]) {
        const query = this.query.select().from(this.query).where(this.query.id.in(ids)).group(this.query.id);
        return await this.findMany(query);
    }

    /**
     * Get all of the blocks at the given heights.
     * @param  {Array} heights the heights of the blocks to retrieve
     * @return {Promise}
     */
    public async findByHeight(heights) {
        return this.db.manyOrNone(sql.findByHeight, { heights });
    }

    /**
     * Count the number of records in the database.
     * @return {Promise}
     */
    public async count() {
        const { count } = await this.db.one(sql.count);
        return count;
    }

    /**
     * Get all of the common blocks from the database.
     * @param  {Array} ids
     * @return {Promise}
     */
    public async common(ids) {
        return this.db.manyOrNone(sql.common, { ids });
    }

    /**
     * Get all of the blocks within the given height range.
     * @param  {Number} start
     * @param  {Number} end
     * @return {Promise}
     */
    public async headers(start, end) {
        return this.db.many(sql.headers, { start, end });
    }

    /**
     * Get all of the blocks within the given height range and order them by height.
     * @param  {Number} start
     * @param  {Number} end
     * @return {Promise}
     */
    public async heightRange(start, end) {
        return this.db.manyOrNone(sql.heightRange, { start, end });
    }

    /**
     * Get the last created block from the database.
     * @return {Promise}
     */
    public async latest() {
        return this.db.oneOrNone(sql.latest);
    }

    /**
     * Get the 10 most recently created blocks from the database.
     * @return {Promise}
     */
    public async recent() {
        return this.db.many(sql.recent);
    }

    /**
     * Get statistics about all blocks from the database.
     * @return {Promise}
     */
    public async statistics() {
        return this.db.one(sql.statistics);
    }

    /**
     * Get top count blocks
     * @return {Promise}
     */
    public async top(count) {
        return this.db.many(sql.top, { top: count });
    }

    /**
     * Delete the block from the database.
     * @param  {Number} id
     * @return {Promise}
     */
    public async delete(id) {
        return this.db.none(sql.delete, { id });
    }

    /**
     * Get the model related to this repository.
     * @return {Block}
     */
    public getModel() {
        return new Block(this.pgp);
    }

    /* TODO: Remove with v1 */
    public async findAll(params: Database.SearchParameters) {
        const selectQuery = this.query.select().from(this.query);
        // Blocks repo atm, doesn't search using any custom parameters
        const parameterList = params.parameters.filter(o => o.operator !== Database.SearchOperator.OP_CUSTOM);
        if (parameterList.length) {
            const first = parameterList.shift();
            /* Notice the difference between 'findAll' and 'search' is that the former assumes eq for all params passed in */
            if (first) {
                selectQuery.where(this.query[this.propToColumnName(first.field)].equals(first.value));
                for (const param of parameterList) {
                    selectQuery.and(this.query[this.propToColumnName(param.field)].equals(param.value));
                }
            }
        }

        return await this.findManyWithCount(selectQuery, params.paginate, params.orderBy);
    }


    public async search(params: Database.SearchParameters) {
        // TODO: we're selecting all the columns right now. Add support for choosing specific columns, when it proves useful.
        const selectQuery = this.query.select().from(this.query);
        // Blocks repo atm, doesn't search using any custom parameters
        const parameterList = params.parameters.filter(o => o.operator !== Database.SearchOperator.OP_CUSTOM);
        if (parameterList.length) {
            let first;
            do {
                first = parameterList.shift();
                // ignore params whose operator is unknown
            } while (!first.operator && parameterList.length);

            if (first) {
                selectQuery.where(this.query[this.propToColumnName(first.field)][first.operator](first.value));
                for (const param of parameterList) {
                    selectQuery.and(this.query[this.propToColumnName(param.field)][param.operator](param.value));
                }
            }
        }

        return await this.findManyWithCount(selectQuery, params.paginate, params.orderBy);
    }
}
