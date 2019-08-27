import { app, Contracts } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Interfaces, Utils } from "@arkecosystem/crypto";
import dayjs from "dayjs";
import partition from "lodash.partition";
import { Transaction } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

export class TransactionsRepository extends Repository implements Contracts.Database.TransactionsRepository {
    public async search(
        parameters: Contracts.Database.SearchParameters,
    ): Promise<Contracts.Database.TransactionsPaginated> {
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
            // 'search' doesn't support custom-op 'ownerId' like 'findAll' can
            const ops = params.filter(value => value.operator !== Contracts.Database.SearchOperator.OP_CUSTOM);

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
                        condition => condition.operator === Contracts.Database.SearchOperator.OP_IN,
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
                } else if (
                    first.field === "recipientId" &&
                    first.operator === Contracts.Database.SearchOperator.OP_EQ
                ) {
                    // Workaround to include transactions (e.g. type 2) where the recipient_id is missing in the database
                    const walletManager: Contracts.State.WalletManager = app.get<Contracts.Database.DatabaseService>(
                        "database",
                    ).walletManager;
                    const recipientWallet: Contracts.State.Wallet = walletManager.findByAddress(first.value);

                    for (const query of [selectQuery, selectQueryCount]) {
                        query.or(
                            this.query.sender_public_key
                                .equals(recipientWallet.publicKey)
                                .and(this.query.recipient_id.isNull()),
                        );
                    }
                }
            } else if (rest.length) {
                const first = rest.shift();

                for (const query of [selectQuery, selectQueryCount]) {
                    query.where(this.query[this.propToColumnName(first.field)][first.operator](first.value));
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

    public async getAssetsByType(type: Enums.TransactionType | number): Promise<any> {
        return this.db.manyOrNone(queries.stateBuilder.assetsByType, { type });
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

    public async findAllByWallet(
        wallet: Contracts.State.Wallet,
        paginate?: Contracts.Database.SearchPaginate,
        orderBy?: Contracts.Database.SearchOrderBy[],
    ): Promise<Contracts.Database.TransactionsPaginated> {
        const selectQuery = this.query.select();
        const selectQueryCount = this.query.select(this.query.count().as("cnt"));

        for (const query of [selectQuery, selectQueryCount]) {
            query
                .from(this.query)
                .where(this.query.sender_public_key.equals(wallet.publicKey))
                .or(this.query.recipient_id.equals(wallet.address));
        }

        return this.findManyWithCount(selectQuery, selectQueryCount, paginate, orderBy);
    }

    public getModel(): Transaction {
        return new Transaction(this.pgp);
    }
}
