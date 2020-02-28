import { Contracts, Utils } from "@arkecosystem/core-kernel";
import { Blocks, Crypto, Enums } from "@arkecosystem/crypto";
import dayjs from "dayjs";
import { Brackets, EntityRepository, In, SelectQueryBuilder } from "typeorm";

import { Transaction } from "../models";
import { AbstractEntityRepository, RepositorySearchResult } from "./repository";
import { SearchCriteria, SearchFilter, SearchOperator, SearchPagination, SearchQueryConverter } from "./search";

@EntityRepository(Transaction)
export class TransactionRepository extends AbstractEntityRepository<Transaction> {
    public getWalletRepository!: () => Contracts.State.WalletRepository;

    public async findByBlockIds(
        blockIds: string[],
    ): Promise<
        Array<{
            id: string;
            blockId: string;
            serialized: Buffer;
        }>
    > {
        return this.find({
            select: ["id", "blockId", "serialized"],
            where: {
                blockId: In(blockIds),
            },
            order: { sequence: "ASC" },
        });
    }

    public async findForged(ids: string[]): Promise<{ id: string }[]> {
        return this.find({
            select: ["id"],
            where: {
                id: In(ids),
            },
        });
    }

    public async getForgedTransactionsIds(ids: string[]): Promise<string[]> {
        if (!ids.length) {
            return [];
        }

        return (await this.findForged(ids)).map(({ id }) => id);
    }

    public async getStatistics(): Promise<{
        count: number;
        totalFee: string;
        totalAmount: string;
    }> {
        return this.createQueryBuilder()
            .select([])
            .addSelect("COUNT(DISTINCT(id))", "count")
            .addSelect("COALESCE(SUM(fee), 0)", "totalFee")
            .addSelect("COALESCE(SUM(amount), 0)", "totalAmount")
            .getRawOne();
    }

    public async getFeeStatistics(
        days: number,
        minFee?: number,
    ): Promise<
        {
            type: number;
            typeGroup: number;
            avg: string;
            min: string;
            max: string;
            sum: string;
        }[]
    > {
        minFee = minFee || 0;

        const age = Crypto.Slots.getTime(
            dayjs()
                .subtract(days, "day")
                .valueOf(),
        );

        return this.createQueryBuilder()
            .select(['type_group AS "typeGroup"', "type"])
            .addSelect("COALESCE(AVG(fee), 0)::int8", "avg")
            .addSelect("COALESCE(MIN(fee), 0)::int8", "min")
            .addSelect("COALESCE(MAX(fee), 0)::int8", "max")
            .addSelect("COALESCE(SUM(fee), 0)::int8", "sum")
            .where("timestamp >= :age AND fee >= :minFee", { age, minFee })
            .groupBy("type_group")
            .addGroupBy("type")
            .orderBy("type_group")
            .getRawMany();
    }

    public async getSentTransactions(): Promise<
        { senderPublicKey: string; amount: string; fee: string; nonce: string }[]
    > {
        return this.createQueryBuilder()
            .select([])
            .addSelect("sender_public_key", "senderPublicKey")
            .addSelect("SUM(amount)", "amount")
            .addSelect("SUM(fee)", "fee")
            .addSelect("COUNT(id)::int8", "nonce")
            .groupBy("sender_public_key")
            .getRawMany();
    }

    // TODO: stuff like this is only needed once during bootstrap
    // shouldnt be part of the repository
    public async findReceivedTransactions(): Promise<{ recipientId: string; amount: string }[]> {
        return this.createQueryBuilder()
            .select([])
            .addSelect("recipient_id", "recipientId")
            .addSelect("SUM(amount)", "amount")
            .where("type = 0 AND type_group = 1")
            .groupBy("recipient_id")
            .getRawMany();
    }

    public async findByType(
        type: number,
        typeGroup: number,
        limit?: number,
        offset?: number,
    ): Promise<Array<Transaction & { blockHeight: number; blockGeneratorPublicKey: string; reward: Utils.BigNumber }>> {
        const transactions = await this.createQueryBuilder("transactions")
            .select()
            .addSelect('blocks.height as "blockHeight"')
            .addSelect('blocks.generatorPublicKey as "blockGeneratorPublicKey"')
            .addSelect('blocks.reward as "reward"')
            .addFrom(Blocks.Block, "blocks")
            .where("block_id = blocks.id")
            .andWhere("type = :type", { type })
            .andWhere("type_group = :typeGroup", { typeGroup })
            .orderBy("transactions.timestamp", "ASC")
            .addOrderBy("transactions.sequence", "ASC")
            .skip(offset)
            .take(limit)
            .getRawMany();

        return transactions.map(transaction => {
            return this.rawToEntity(
                transaction,
                // @ts-ignore
                (entity: any, key: string, value: number | string) => {
                    if (key === "reward") {
                        entity[key] = Utils.BigNumber.make(value);
                    } else {
                        entity[key] = value;
                    }
                },
            );
        }) as any;
    }

    public async findByIdAndType(type: number, id: string): Promise<Transaction | undefined> {
        return this.findOne({
            select: [
                "senderPublicKey",
                "timestamp",
                "asset",
                "version",
                "id",
                "fee",
                "amount",
                "recipientId",
                "serialized",
            ],
            where: {
                id,
                type,
            },
        });
    }

    public async findByHtlcLocks(lockIds: string[]): Promise<Transaction[]> {
        return this.createQueryBuilder()
            .select()
            .where("type IN (:...lockIds)", { lockIds })
            .andWhere("type_group = 1")
            .andWhere(
                `
                (
                    asset->'refund'->'lockTransactionId' ?| array[:lockIds]
                OR
                    asset->'claim'->'lockTransactionId' ?| array[:lockIds]
                )
            `,
            )
            .getMany();
    }

    public async getOpenHtlcLocks(): Promise<Array<Transaction & { open: boolean }>> {
        const lockedIds = this.createQueryBuilder()
            .select([])
            .addSelect(
                `COALESCE(
                asset->'refund'->>'lockTransactionId',
                asset->'claim'->>'lockTransactionId'
            )`,
                "id",
            )
            .where("type IN (9, 10)")
            .andWhere("type_group = 1");

        return this.createQueryBuilder()
            .select()
            .addSelect(subQuery => {
                return subQuery
                    .select([])
                    .select("id")
                    .where("T.id IN (" + lockedIds.getQuery() + ")")
                    .from(Transaction, "T")
                    .limit(1);
            }, "open")
            .where("type = 8")
            .andWhere("type_group = 1")
            .getRawMany();
    }

    public async getClaimedHtlcLockBalances(): Promise<{ amount: string; recipientId: string }[]> {
        const lockedIds = this.createQueryBuilder()
            .select("id")
            .where("type = 9")
            .andWhere("type_group = 1");

        return this.createQueryBuilder()
            .select("recipient_id")
            .addSelect("SUM(amount)", "amount")
            .where("id IN (" + lockedIds.getQuery() + ")")
            .groupBy("recipient_id")
            .getRawMany();
    }

    public async getRefundedHtlcLockBalances(): Promise<{ amount: string; senderPublicKey: string }[]> {
        const lockedIds = this.createQueryBuilder()
            .select("id")
            .where("type = 10")
            .andWhere("type_group = 1");

        return this.createQueryBuilder()
            .select("sender_public_key")
            .addSelect("SUM(amount)", "amount")
            .where("id IN (" + lockedIds.getQuery() + ")")
            .groupBy("sender_public_key")
            .getRawMany();
    }

    public async searchByQuery(
        query: Record<string, any>,
        pagination: SearchPagination,
    ): Promise<RepositorySearchResult<Transaction>> {
        const filter: SearchFilter = SearchQueryConverter.toSearchFilter(query, pagination, this.metadata.columns);
        return this.search(filter);
    }

    public async search(filter: SearchFilter): Promise<RepositorySearchResult<Transaction>> {
        this.updateSearchFilter(filter);

        const queryBuilder: SelectQueryBuilder<Transaction> = this.createQueryBuilderFromFilter(filter);
        const criteria: SearchCriteria[] = filter.criteria;

        if (criteria && criteria.length) {
            // Special handling when called for `/wallets/transactions` endpoint
            let walletAddress: string | undefined;
            let walletPublicKey: string | undefined;
            let useWhere: boolean = false;

            // 'search' doesn't support custom-op 'ownerId' like 'findAll' can
            const operators = criteria.filter(value => {
                if (value.field === "walletAddress") {
                    walletAddress = value.value as string;
                } else if (value.field === "walletPublicKey") {
                    walletPublicKey = value.value as string;
                }

                return value.operator !== SearchOperator.Custom;
            });

            const [participants, rest] = Utils.partition(operators, operator =>
                ["sender_public_key", "recipient_id"].includes(this.propertyToColumnName(operator.field)!),
            );

            if (participants.length > 0) {
                const [first, last] = participants;

                const firstExpression = this.criteriaToExpression(first);
                queryBuilder.where(firstExpression.expression, firstExpression.parameters);

                if (last) {
                    const usesInOperator: boolean = participants.every(
                        condition => condition.operator === SearchOperator.In,
                    );
                    const { expression, parameters } = this.criteriaToExpression(last);
                    if (usesInOperator) {
                        queryBuilder.orWhere(expression, parameters);
                    } else {
                        // This search is 1 `senderPublicKey` and 1 `recipientId`
                        queryBuilder.andWhere(expression, parameters);
                    }
                } else if (first.field === "recipientId" && first.operator === SearchOperator.Equal) {
                    // Workaround to include transactions (e.g. type 2) where the recipient_id is missing in the database
                    const recipientWallet: Contracts.State.Wallet = this.getWalletRepository().findByAddress(
                        first.value as string,
                    );

                    queryBuilder
                        .orWhere(
                            new Brackets(qb => {
                                qb.where("sender_public_key = :recipientPublicKey", {
                                    recipientPublicKey: recipientWallet.publicKey,
                                }).andWhere("recipient_id IS NULL");
                            }),
                        )
                        .orWhere(
                            new Brackets(qb => {
                                qb.where("type = 6")
                                    .andWhere("type_group = 1")
                                    .andWhere(`asset @> :paymentAsset`, {
                                        paymentAsset: {
                                            payment: [{ recipientId: first.value }],
                                        },
                                    });
                            }),
                        );
                }
            } else if (rest.length) {
                const first = rest.shift();
                Utils.assert.defined<string>(first);
                const restExpression = this.criteriaToExpression(first);
                queryBuilder.where(restExpression.expression, restExpression.parameters);
            } else {
                useWhere = true;
            }

            if (walletAddress) {
                queryBuilder[useWhere ? "where" : "andWhere"]("recipient_id = :walletAddress", {
                    walletAddress,
                }).orWhere(
                    new Brackets(qb => {
                        qb.where("type = 6")
                            .andWhere("type_group = 1")
                            .andWhere(`asset @> :paymentAsset`, {
                                paymentAsset: {
                                    payment: [{ recipientId: walletAddress }],
                                },
                            });
                    }),
                );

                // We do not know public key for cold wallets
                if (walletPublicKey) {
                    queryBuilder.orWhere("sender_public_key = :walletPublicKey", { walletPublicKey });
                }
            }

            for (const criteria of rest) {
                const { expression, parameters } = this.criteriaToExpression(criteria);
                queryBuilder.andWhere(expression, parameters);
            }
        }

        return this.performSearch(queryBuilder);
    }

    private updateSearchFilter(filter: SearchFilter): void {
        filter.limit = filter.limit ?? 100;
        filter.offset = filter.offset ?? 0;

        const criteriaMap: Record<string, SearchCriteria> = {};

        if (filter.criteria) {
            for (const criteria of Object.values(filter.criteria)) {
                criteriaMap[criteria.field] = criteria;
            }
        }

        if (criteriaMap.type !== undefined) {
            const typeGroup: SearchCriteria | undefined = criteriaMap.typeGroup;
            if (typeGroup === undefined) {
                filter.criteria.push({
                    field: "typeGroup",
                    value: Enums.TransactionTypeGroup.Core,
                    operator: SearchOperator.Equal,
                });
            }
        }
        const senderId: SearchCriteria | undefined = criteriaMap.senderId;
        if (criteriaMap.senderId) {
            if (this.getWalletRepository().hasByAddress(senderId.value as string)) {
                filter.criteria.push({
                    field: "senderPublicKey",
                    value: this.getWalletRepository().findByAddress(senderId.value as string).publicKey!,
                    operator: SearchOperator.Equal,
                });
            } else {
                throw new Error(`Invalid senderId:${senderId.value}`);
            }

            filter.criteria.splice(filter.criteria.indexOf(senderId), 1);
        }

        if (!filter.orderBy || !filter.orderBy.length) {
            filter.orderBy = [
                {
                    field: "timestamp",
                    direction: "DESC",
                },
            ];
        }

        filter.orderBy.push({
            field: "sequence",
            direction: "DESC",
        });
    }
}
