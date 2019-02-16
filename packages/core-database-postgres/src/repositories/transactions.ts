import { Database } from "@arkecosystem/core-interfaces";
import { slots } from "@arkecosystem/crypto";
import { models } from "@arkecosystem/crypto"
import dayjs from "dayjs-ext";
import partition from "lodash/partition";
import { Transaction } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

const { transactions: sql } = queries;

export class TransactionsRepository extends Repository implements Database.ITransactionsRepository {
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
    public async findByBlockId(id) {
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
    public async deleteByBlockId(id) {
        return this.db.none(sql.deleteByBlock, { id });
    }

    /**
     * Get the model related to this repository.
     * @return {Transaction}
     */
    public getModel() {
        return new Transaction(this.pgp);
    }

    public getFeeStatistics(minFeeBroadcast: number): Promise<any> {
        const query = this.q
            .select(
                this.q.type,
                this.q.fee.min("minFee"),
                this.q.fee.max("maxFee"),
                this.q.fee.avg("avgFee"),
                this.q.timestamp.max("timestamp"),
            )
            .from(this.q)
            // Should make this '30' figure configurable
            .where(
                this.q.timestamp.gte(slots.getTime(dayjs().subtract(30, "day").valueOf())
                )
            )
            .and(this.q.fee.gte(minFeeBroadcast))
            .group(this.q.type)
            .order('"timestamp" DESC');

        return this.findMany(query);
    }

    public async search(parameters: Database.SearchParameters) {
        return this.findAll(parameters);
    }

    // TODO: deprecate after unifying with 'search'
    public async findAll(parameters: Database.SearchParameters) {
        if(!parameters.paginate) {
            parameters.paginate = {
                limit: 100,
                offset: 0
            }
        }
        const selectQuery = this.q.select().from(this.q);
        const params = parameters.parameters;
        if (params.length) {
            // custom operators have a null 'operator' prop
            const [customOps, simpleOps] = partition(params, param => param.operator === Database.SearchOperator.OP_CUSTOM);

            const [participants, rest] = partition(simpleOps, op => ["sender_public_key", "recipient_id"].includes(this.propToColumnName(op.field)));

            if (participants.length > 0) {
                const [first, last] = participants;
                selectQuery.where(this.q[this.propToColumnName(first.field)][first.operator](first.value));

                if (last) {
                    const usesInOperator = participants.every(condition => condition.operator === Database.SearchOperator.OP_IN);
                    if (usesInOperator) {
                        selectQuery.or(this.q[this.propToColumnName(last.field)][last.operator](last.value));
                    } else {
                        // This search is 1 `senderPublicKey` and 1 `recipientId`
                        selectQuery.and(this.q[this.propToColumnName(last.field)][last.operator](last.value));
                    }
                }
            } else if (rest.length) {
                const first = rest.shift();
                selectQuery.where(this.q[this.propToColumnName(first.field)][first.operator](first.value));
            }

            for (const condition of rest) {
                selectQuery.and(this.q[this.propToColumnName(condition.field)][condition.operator](condition.value));
            }

            customOps.forEach(o => {
                if (o.field === "ownerWallet") {
                    const wallet = o.value as models.Wallet;
                    if (simpleOps.length) {
                        selectQuery.and(this.q.sender_public_key.equals(wallet.publicKey).or(this.q.recipient_id).equals(wallet.address))
                    } else {
                        selectQuery.where(
                            this.q.sender_public_key.equals(wallet.publicKey).or(this.q.recipient_id).equals(wallet.address)
                        );
                    }

                }
            });
        }
        return this.findManyWithCount(selectQuery, parameters.paginate, parameters.orderBy);
    }

    public async findAllByWallet(wallet: any, paginate?: Database.SearchPaginate, orderBy?: Database.SearchOrderBy[]) {
        const selectQuery = this.q.select().from(this.q)
            .where(this.q.sender_public_key.equals(wallet.publicKey))
            .or(this.q.recipient_id.equals(wallet.address));

        return await this.findManyWithCount(selectQuery, paginate, orderBy);
    }

    public async findWithVendorField() {
        const selectQuery = this.q.select().from(this.q)
            .where(this.q.vendor_field_hex.isNotNull());

        return this.findMany(selectQuery);
    }
}
