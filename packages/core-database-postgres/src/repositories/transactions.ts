import { Database } from "@arkecosystem/core-interfaces";
import { Crypto, Interfaces, Utils } from "@arkecosystem/crypto";
import { dato } from "@faustbrian/dato";
import partition from "lodash.partition";
import { Transaction } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

// @TODO: add database transaction interface
export class TransactionsRepository extends Repository implements Database.ITransactionsRepository {
    public async findById(id: string): Promise<Interfaces.ITransactionData> {
        return this.db.oneOrNone(queries.transactions.findById, { id });
    }

    public async findByBlockId(
        id: string,
    ): Promise<
        Array<{
            id: string;
            serialized: string;
        }>
    > {
        return this.db.manyOrNone(queries.transactions.findByBlock, { id });
    }

    public async latestByBlock(
        id: string,
    ): Promise<
        Array<{
            id: string;
            serialized: string;
        }>
    > {
        return this.db.manyOrNone(queries.transactions.latestByBlock, { id });
    }

    public async latestByBlocks(
        ids: string[],
    ): Promise<
        Array<{
            id: string;
            block_id: string;
            serialized: string;
        }>
    > {
        return this.db.manyOrNone(queries.transactions.latestByBlocks, { ids });
    }

    public async forged(ids: string[]): Promise<string[]> {
        return this.db.manyOrNone(queries.transactions.forged, { ids });
    }

    public async statistics(): Promise<{
        count: number;
        totalFee: Utils.BigNumber;
        totalAmount: Utils.BigNumber;
    }> {
        return this.db.one(queries.transactions.statistics);
    }

    public async deleteByBlockId(id: string): Promise<void> {
        return this.db.none(queries.transactions.deleteByBlock, { id });
    }

    public async getFeeStatistics(
        days: number,
        minFeeBroadcast?: number,
    ): Promise<Array<{ type: number; fee: number; timestamp: number }>> {
        return this.findMany(
            this.query
                .select(this.query.type, this.query.fee, this.query.timestamp)
                .from(this.query)
                .where(
                    this.query.timestamp.gte(
                        Crypto.slots.getTime(
                            dato()
                                .subDays(days)
                                .toMilliseconds(),
                        ),
                    ),
                )
                .and(this.query.fee.gte(minFeeBroadcast))
                .order('"timestamp" DESC'),
        );
    }

    public async findAllByWallet(
        wallet: any,
        paginate?: Database.SearchPaginate,
        orderBy?: Database.SearchOrderBy[],
    ): Promise<{ rows: Interfaces.ITransactionData[]; count: number }> {
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

    public async findWithVendorField(): Promise<Interfaces.ITransactionData[]> {
        const selectQuery = this.query
            .select()
            .from(this.query)
            .where(this.query.vendor_field_hex.isNotNull());

        return this.findMany(selectQuery);
    }

    // TODO: Remove with v1
    public async findAll(
        parameters: Database.SearchParameters,
    ): Promise<{ rows: Interfaces.ITransactionData[]; count: number }> {
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

            const hasNonCustomOps: boolean = otherOps.length > 0;

            const first = otherOps.shift();

            if (first) {
                selectQuery.where(this.query[this.propToColumnName(first.field)].equals(first.value));

                for (const op of otherOps) {
                    selectQuery.and(this.query[this.propToColumnName(op.field)].equals(op.value));
                }
            }

            customOps.forEach(o => {
                if (o.field === "ownerWallet") {
                    const wallet: Database.IWallet = o.value;

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

    public async search(
        parameters: Database.SearchParameters,
    ): Promise<{ rows: Interfaces.ITransactionData[]; count: number }> {
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

    public getModel(): Transaction {
        return new Transaction(this.pgp);
    }
}
