import { Database } from "@arkecosystem/core-interfaces";
import { Wallet } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

const { wallets: sql } = queries;

export class WalletsRepository extends Repository implements Database.IWalletsRepository {
    /**
     * Get all of the wallets from the database.
     * @return {Promise}
     */
    public async all() {
        return this.db.manyOrNone(sql.all);
    }

    /**
     * Find a wallet by its address.
     * @param  {String} address
     * @return {Promise}
     */
    public async findByAddress(address) {
        return this.db.oneOrNone(sql.findByAddress, { address });
    }

    /**
     * Get the count of wallets that have a negative balance.
     * @return {Promise}
     */
    public async tallyWithNegativeBalance() {
        return this.db.oneOrNone(sql.findNegativeBalances);
    }

    /**
     * Get the count of wallets that have a negative vote balance.
     * @return {Promise}
     */
    public async tallyWithNegativeVoteBalance() {
        return this.db.oneOrNone(sql.findNegativeVoteBalances);
    }

    /**
     * Create or update a record matching the attributes, and fill it with values.
     * @param  {Object} wallet
     * @return {Promise}
     */
    public async updateOrCreate(wallet) {
        const query = `${this.insertQuery(wallet)} ON CONFLICT(address) DO UPDATE SET ${this.pgp.helpers.sets(
            wallet,
            this.model.getColumnSet(),
        )}`;

        return this.db.none(query);
    }

    /**
     * Get the model related to this repository.
     * @return {Object}
     */
    public getModel() {
        return new Wallet(this.pgp);
    }
}
