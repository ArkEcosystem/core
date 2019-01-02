import { Transaction } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

const { transactions: sql } = queries;

export class TransactionsRepository extends Repository {
    /**
     * Find a transactions by its ID.
     * @param  {String} id
     * @return {Promise}
     */
    public async findById(id) {
        return this.db.oneOrNone(sql.findById, { id });
    }

    /**
     * Find multiple transactionss by their block ID.
     * @param  {String} id
     * @return {Promise}
     */
    public async findByBlock(id) {
        return this.db.manyOrNone(sql.findByBlock, { id });
    }

    /**
     * Find multiple transactionss by their block ID and order them by sequence.
     * @param  {Number} id
     * @return {Promise}
     */
    public async latestByBlock(id) {
        return this.db.manyOrNone(sql.latestByBlock, { id });
    }

    /**
     * Find multiple transactionss by their block IDs and order them by sequence.
     * @param  {Array} ids
     * @return {Promise}
     */
    public async latestByBlocks(ids) {
        return this.db.manyOrNone(sql.latestByBlocks, { ids });
    }

    /**
     * Get all of the forged transactions from the database.
     * @param  {Array} ids
     * @return {Promise}
     */
    public async forged(ids) {
        return this.db.manyOrNone(sql.forged, { ids });
    }

    /**
     * Get statistics about all transactions from the database.
     * @return {Promise}
     */
    public async statistics() {
        return this.db.one(sql.statistics);
    }

    /**
     * Delete the transactions from the database.
     * @param  {Number} id
     * @return {Promise}
     */
    public async deleteByBlock(id) {
        return this.db.none(sql.deleteByBlock, { id });
    }

    /**
     * Get the model related to this repository.
     * @return {Transaction}
     */
    public getModel() {
        return new Transaction(this.pgp);
    }
}
