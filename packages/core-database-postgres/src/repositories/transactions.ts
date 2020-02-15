import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { Crypto, Enums, Interfaces, Utils } from "@arkecosystem/crypto";
import dayjs from "dayjs";
import partition from "lodash.partition";
import { Transaction } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

export class TransactionsRepository extends Repository implements Database.ITransactionsRepository {
    public async search(parameters: Database.ISearchParameters): Promise<Database.ITransactionsPaginated> {
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
            let walletAddress: string;
            let walletPublicKey: string;

            // 'search' doesn't support custom-op 'ownerId' like 'findAll' can
            const ops = params.filter(value => {
                if (value.field === "walletAddress") {
                    walletAddress = value.value;
                } else if (value.field === "walletPublicKey") {
                    walletPublicKey = value.value;
                }

                return value.operator !== Database.SearchOperator.OP_CUSTOM;
            });

            const [participants, rest] = partition(ops, op =>
                ["sender_public_key", "recipient_id"].includes(this.propToColumnName(op.field)),
            );

            if (participants.length > 0) {
                const [first, last] = participants;
                for (const query of [selectQuery, selectQueryCount]) {
                    query.where(this.query[this.propToColumnName(first.field)][first.operator](first.value));
                }

                if (last) {
                    const usesInOperator = participants.every(
                        condition => condition.operator === Database.SearchOperator.OP_IN,
                    );

                    if (usesInOperator) {
                        for (const query of [selectQuery, selectQueryCount]) {
                            query.or(this.query[this.propToColumnName(last.field)][last.operator](last.value));
                        }
                    } else {
                        // This search is 1 `senderPublicKey` and 1 `recipientId`
                        for (const query of [selectQuery, selectQueryCount]) {
                            query.and(this.query[this.propToColumnName(last.field)][last.operator](last.value));
                        }
                    }
                } else if (first.field === "recipientId" && first.operator === Database.SearchOperator.OP_EQ) {
                    // Workaround to include transactions (e.g. type 2) where the recipient_id is missing in the database
                    const walletManager: State.IWalletManager = app.resolvePlugin<Database.IDatabaseService>("database")
                        .walletManager;
                    const recipientWallet: State.IWallet = walletManager.findByAddress(first.value);

                    for (const query of [selectQuery, selectQueryCount]) {
                        query
                            .or(
                                this.query.sender_public_key
                                    .equals(recipientWallet.publicKey)
                                    .and(this.query.recipient_id.isNull()),
                            )
                            .or(
                                // Include multipayment recipients
                                this.query.type
                                    .equals(Enums.TransactionType.MultiPayment)
                                    .and(this.query.type_group.equals(Enums.TransactionTypeGroup.Core))
                                    .and(
                                        this.query.asset.contains({
                                            payments: [
                                                {
                                                    recipientId: first.value,
                                                },
                                            ],
                                        }),
                                    ),
                            );
                    }
                }
            } else if (rest.length) {
                const first = rest.shift();

                for (const query of [selectQuery, selectQueryCount]) {
                    query.where(this.query[this.propToColumnName(first.field)][first.operator](first.value));
                }
            }

            if (walletAddress) {
                const useWhere: boolean = !selectQuery.nodes.some(node => node.type === "WHERE");
                for (const query of [selectQuery, selectQueryCount]) {
                    let condition = this.query.recipient_id.equals(walletAddress).or(
                        // Include multipayment recipients
                        this.query.type
                            .equals(Enums.TransactionType.MultiPayment)
                            .and(this.query.type_group.equals(Enums.TransactionTypeGroup.Core))
                            .and(
                                this.query.asset.contains({
                                    payments: [
                                        {
                                            recipientId: walletAddress,
                                        },
                                    ],
                                }),
                            ),
                    );

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

    public async findById(id: string): Promise<Interfaces.ITransactionData> {
        return this.db.oneOrNone(queries.transactions.findById, { id });
    }

    public async findByBlockId(
        id: string,
    ): Promise<
        Array<{
            id: string;
            serialized: Buffer;
        }>
    > {
        return this.db.manyOrNone(queries.transactions.findByBlock, { id });
    }

    public async latestByBlock(
        id: string,
    ): Promise<
        Array<{
            id: string;
            serialized: Buffer;
        }>
    > {
        return this.db.manyOrNone(queries.transactions.latestByBlock, { id });
    }

    public async latestByBlocks(
        ids: string[],
    ): Promise<
        Array<{
            id: string;
            blockId: string;
            serialized: Buffer;
        }>
    > {
        return this.db.manyOrNone(queries.transactions.latestByBlocks, { ids });
    }

    public async getCountOfType(type: number, typeGroup: number = Enums.TransactionTypeGroup.Core): Promise<any> {
        return +(await this.db.one(queries.stateBuilder.countType, { typeGroup, type })).count;
    }

    public async getAssetsByType(type: number, typeGroup: number, limit: number, offset: number): Promise<any> {
        return this.db.manyOrNone(queries.stateBuilder.assetsByType, { typeGroup, type, limit, offset });
    }

    public async getReceivedTransactions(): Promise<any> {
        return this.db.many(queries.stateBuilder.receivedTransactions);
    }

    public async getSentTransactions(): Promise<any> {
        return this.db.many(queries.stateBuilder.sentTransactions);
    }

    public async forged(ids: string[]): Promise<Interfaces.ITransactionData[]> {
        return this.db.manyOrNone(queries.transactions.forged, { ids });
    }

    public async getOpenHtlcLocks(): Promise<any> {
        return this.db.manyOrNone(queries.stateBuilder.openLocks);
    }

    public async getRefundedHtlcLocks(): Promise<any> {
        return this.db.manyOrNone(queries.stateBuilder.refundedLocks);
    }

    public async getClaimedHtlcLocks(): Promise<any> {
        return this.db.manyOrNone(queries.stateBuilder.claimedLocks);
    }

    public async findByHtlcLocks(lockIds: string[]): Promise<Interfaces.ITransactionData[]> {
        return this.db.manyOrNone(queries.transactions.findByHtlcLocks, { ids: lockIds });
    }

    public async statistics(): Promise<{
        count: number;
        totalFee: Utils.BigNumber;
        totalAmount: Utils.BigNumber;
    }> {
        return this.db.one(queries.transactions.statistics);
    }

    public async deleteByBlockId(ids: string[], db: any): Promise<void> {
        return db.none(queries.transactions.deleteByBlock, { ids });
    }

    public async getFeeStatistics(
        days: number,
        minFee?: number,
    ): Promise<Array<{ type: number; fee: number; timestamp: number }>> {
        minFee = minFee || 0;

        const age = Crypto.Slots.getTime(
            dayjs()
                .subtract(days, "day")
                .valueOf(),
        );

        return this.db.manyOrNone(queries.transactions.feeStatistics, { age, minFee });
    }

    public getModel(): Transaction {
        return new Transaction(this.pgp);
    }
}
