import { Database } from "@arkecosystem/core-interfaces";
import { Model } from "../models";

export abstract class Repository implements Database.IRepository {
    protected model: Model;

    /**
     * Create a new repository instance.
     * @param  {Object} db
     * @param  {Object} pgp
     */
    constructor(public db, public pgp) {
        this.model = this.getModel();
    }

    /**
     * Get the model related to this repository.
     * @return {Model}
     */
    public abstract getModel(): Model;

    /**
     * Estimate the number of records in the table.
     * @return {Promise}
     */
    public async estimate() {
        return this.db.one(`SELECT count_estimate('SELECT * FROM ${this.model.getTable()})`);
    }

    /**
     * Run a truncate statement on the table.
     * @return {Promise}
     */
    public async truncate() {
        return this.db.none(`TRUNCATE ${this.model.getTable()} RESTART IDENTITY`);
    }

    /**
     * Create one or many instances of the related models.
     * @param  {Array|Object} items
     * @return {Promise}
     */
    public async insert(items) {
        return this.db.none(this.__insertQuery(items));
    }

    /**
     * Update one or many instances of the related models.
     * @param  {Array|Object} items
     * @return {Promise}
     */
    public async update(items) {
        return this.db.none(this.__updateQuery(items));
    }

    /**
     * Generate an "INSERT" query for the given data.
     * @param  {Array|Object} data
     * @return {String}
     */
    public __insertQuery(data) {
        return this.pgp.helpers.insert(data, this.model.getColumnSet());
    }

    /**
     * Generate an "UPDATE" query for the given data.
     * @param  {Array|Object} data
     * @return {String}
     */
    public __updateQuery(data) {
        return this.pgp.helpers.update(data, this.model.getColumnSet());
    }
}
