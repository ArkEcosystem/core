import { Database } from "@arkecosystem/core-interfaces";
import { Crypto } from "@arkecosystem/crypto";
import { dato } from "@faustbrian/dato";
import partition from "lodash.partition";
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
        const query = this.query
            .select(
                this.query.type,
                this.query.fee.min("minFee"),
                this.query.fee.max("maxFee"),
                this.query.fee.avg("avgFee"),
                this.query.timestamp.max("timestamp"),
            )
            .from(this.query)
            // Should make this '30' figure configurable
            .where(
                this.query.timestamp.gte(
                    Crypto.slots.getTime(
                        dato()
                            .subDays(30)
                            .toMilliseconds(),
                    ),
                ),
            )
            .and(this.query.fee.gte(minFeeBroadcast))
            .group(this.query.type)
            .order('"timestamp" DESC');

        return this.findMany(query);
    }

    public async findAllByWallet(wallet: any, paginate?: Database.SearchPaginate, orderBy?: Database.SearchOrderBy[]) {
        return this.findManyWithCount(
            this.query
                .select()
                .from(this.query)
                .where(this.query.sender_public_key.equals(wallet.publicKey))
                .or(this.query.recipient_id.equals(wallet.address)),
            paginate,
            orderBy,
        );
    }

    public async findWithVendorField() {
        const selectQuery = this.query
            .select()
            .from(this.query)
            .where(this.query.vendor_field_hex.isNotNull());

        return this.findMany(selectQuery);
    }

    // TODO: Remove with v1
    public async findAll(parameters: Database.SearchParameters) {
        if (!parameters.paginate) {
            parameters.paginate = {
                limit: 100,
                offset: 0,
            };
        }
        const selectQuery = this.query.select().from(this.query);
        const params = parameters.parameters;
        if (params.length) {
            const [customOps, otherOps] = partition(
                params,
                param => param.operator === Database.SearchOperator.OP_CUSTOM,
            );

            const hasNonCustomOps = otherOps.length > 0;

            const first = otherOps.shift();
            if (first) {
                selectQuery.where(this.query[this.propToColumnName(first.field)].equals(first.value));
                for (const op of otherOps) {
                    selectQuery.and(this.query[this.propToColumnName(op.field)].equals(op.value));
                }
            }

            customOps.forEach(o => {
                if (o.field === "ownerWallet") {
                    const wallet = o.value as Database.IWallet;
                    if (hasNonCustomOps) {
                        selectQuery.and(
                            this.query.sender_public_key
                                .equals(wallet.publicKey)
                                .or(this.query.recipient_id.equals(wallet.address)),
                        );
                    } else {
                        selectQuery
                            .where(this.query.sender_public_key.equals(wallet.publicKey))
                            .or(this.query.recipient_id.equals(wallet.address));
                    }
                }
            });
        }
        return this.findManyWithCount(selectQuery, parameters.paginate, parameters.orderBy);
    }

    public async search(parameters: Database.SearchParameters) {
        if (!parameters.paginate) {
            parameters.paginate = {
                limit: 100,
                offset: 0,
            };
        }
        const selectQuery = this.query.select().from(this.query);
        const params = parameters.parameters;
        if (params.length) {
            // 'search' doesn't support custom-op 'ownerId' like 'findAll' can
            const ops = params.filter(value => value.operator !== Database.SearchOperator.OP_CUSTOM);

            const [participants, rest] = partition(ops, op =>
                ["sender_public_key", "recipient_id"].includes(this.propToColumnName(op.field)),
            );

            if (participants.length > 0) {
                const [first, last] = participants;
                selectQuery.where(this.query[this.propToColumnName(first.field)][first.operator](first.value));

                if (last) {
                    const usesInOperator = participants.every(
                        condition => condition.operator === Database.SearchOperator.OP_IN,
                    );
                    if (usesInOperator) {
                        selectQuery.or(this.query[this.propToColumnName(last.field)][last.operator](last.value));
                    } else {
                        // This search is 1 `senderPublicKey` and 1 `recipientId`
                        selectQuery.and(this.query[this.propToColumnName(last.field)][last.operator](last.value));
                    }
                }
            } else if (rest.length) {
                const first = rest.shift();
                selectQuery.where(this.query[this.propToColumnName(first.field)][first.operator](first.value));
            }

            for (const condition of rest) {
                selectQuery.and(
                    this.query[this.propToColumnName(condition.field)][condition.operator](condition.value),
                );
            }
        }
        return this.findManyWithCount(selectQuery, parameters.paginate, parameters.orderBy);
    }
}
