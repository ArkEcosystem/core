import { Utils } from "@arkecosystem/core-kernel";
import { Crypto, Enums } from "@arkecosystem/crypto";
import dayjs from "dayjs";
import { Brackets, EntityRepository, In } from "typeorm";

import { Block } from "../models/block";
import { Transaction } from "../models/transaction";
import { AbstractRepository } from "./abstract-repository";

type FeeStatistics = {
    type: number;
    typeGroup: number;
    avg: number;
    min: number;
    max: number;
    sum: number;
};
@EntityRepository(Transaction)
export class TransactionRepository extends AbstractRepository<Transaction> {
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

    public async getForgedTransactionsIds(ids: string[]): Promise<string[]> {
        const transactions = await this.find({
            select: ["id"],
            where: {
                id: In(ids),
            },
        });
        return transactions.map((t) => t.id);
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
        txTypes: Array<{ type: number, typeGroup: number }>,
        days?: number,
        minFee?: number,
    ): Promise<FeeStatistics[]> {
        minFee = minFee || 0;

        if (days) {
            const age = Crypto.Slots.getTime(dayjs().subtract(days, "day").valueOf());

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

        // no days parameter, take the stats from each type for its last 20 txs
        const feeStatistics: FeeStatistics[] = [];
        for (const feeStatsByType of txTypes) {
            // we don't use directly this.createQueryBuilder() because it forces to have FROM transactions
            // instead of just the FROM (...) subquery
            const feeStatsForType: FeeStatistics = await this.manager.connection.createQueryBuilder()
                .select(['subquery.type_group AS "typeGroup"', "subquery.type"])
                .addSelect("COALESCE(AVG(subquery.fee), 0)::int8", "avg")
                .addSelect("COALESCE(MIN(subquery.fee), 0)::int8", "min")
                .addSelect("COALESCE(MAX(subquery.fee), 0)::int8", "max")
                .addSelect("COALESCE(SUM(subquery.fee), 0)::int8", "sum")
                .from(
                    qb => qb
                        .subQuery()
                        .select()
                        .from("transactions", "txs")
                        .where(
                            "txs.type = :type and txs.type_group = :typeGroup",
                            { type: feeStatsByType.type, typeGroup: feeStatsByType.typeGroup }
                        )
                        .orderBy("txs.block_height", "DESC")
                        .addOrderBy("txs.sequence", "DESC")
                        .limit(20),
                    "subquery"
                )
                .groupBy("subquery.type_group")
                .addGroupBy("subquery.type")
                .getRawOne();
            feeStatistics.push(feeStatsForType ?? {
                type: feeStatsByType.type,
                typeGroup: feeStatsByType.typeGroup,
                avg: 0,
                min: 0,
                max: 0,
                sum: 0,
            });
        }

        return feeStatistics;
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
            .where(`type_group = ${Enums.TransactionTypeGroup.Core}`)
            .andWhere(`type = ${Enums.TransactionType.Transfer}`)
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
            .addFrom(Block, "blocks")
            .where("block_id = blocks.id")
            .andWhere("type = :type", { type })
            .andWhere("type_group = :typeGroup", { typeGroup })
            .orderBy("transactions.timestamp", "ASC")
            .addOrderBy("transactions.sequence", "ASC")
            .skip(offset)
            .take(limit)
            .getRawMany();

        return transactions.map((transaction) => {
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

    public async findByHtlcLocks(lockIds: string[]): Promise<Transaction[]> {
        return this.createQueryBuilder()
            .select()
            .where(
                new Brackets((qb) => {
                    qb.where(`type_group = ${Enums.TransactionTypeGroup.Core}`)
                        .andWhere(`type = ${Enums.TransactionType.HtlcClaim}`)
                        .andWhere("asset->'claim'->>'lockTransactionId' IN (:...lockIds)", { lockIds });
                }),
            )
            .orWhere(
                new Brackets((qb) => {
                    qb.where(`type_group = ${Enums.TransactionTypeGroup.Core}`)
                        .andWhere(`type = ${Enums.TransactionType.HtlcRefund}`)
                        .andWhere("asset->'refund'->>'lockTransactionId' IN (:...lockIds)", { lockIds });
                }),
            )
            .getMany();
    }

    public async getOpenHtlcLocks(): Promise<Array<Transaction>> {
        return this.createQueryBuilder()
            .select()
            .where(`type_group = ${Enums.TransactionTypeGroup.Core}`)
            .andWhere(`type = ${Enums.TransactionType.HtlcLock}`)
            .andWhere((qb) => {
                const claimedIdsSubQuery = qb
                    .subQuery()
                    .select("asset->'claim'->>'lockTransactionId'")
                    .from(Transaction, "t")
                    .where(`type_group = ${Enums.TransactionTypeGroup.Core}`)
                    .andWhere(`type = ${Enums.TransactionType.HtlcClaim}`);
                return `id NOT IN ${claimedIdsSubQuery.getQuery()}`;
            })
            .andWhere((qb) => {
                const refundedIdsSubQuery = qb
                    .subQuery()
                    .select("asset->'refund'->>'lockTransactionId'")
                    .from(Transaction, "t")
                    .where(`type_group = ${Enums.TransactionTypeGroup.Core}`)
                    .andWhere(`type = ${Enums.TransactionType.HtlcRefund}`);
                return `id NOT IN ${refundedIdsSubQuery.getQuery()}`;
            })
            .getMany();
    }

    public async getClaimedHtlcLockBalances(): Promise<{ recipientId: string; claimedBalance: string }[]> {
        return this.createQueryBuilder()
            .select(`recipient_id AS "recipientId"`)
            .addSelect("SUM(amount)", "claimedBalance")
            .where(`type_group = ${Enums.TransactionTypeGroup.Core}`)
            .andWhere(`type = ${Enums.TransactionType.HtlcLock}`)
            .andWhere((qb) => {
                const claimedLockIdsSubQuery = qb
                    .subQuery()
                    .select("asset->'claim'->>'lockTransactionId'")
                    .from(Transaction, "t")
                    .where(`type_group = ${Enums.TransactionTypeGroup.Core}`)
                    .andWhere(`type = ${Enums.TransactionType.HtlcClaim}`);
                return `id IN ${claimedLockIdsSubQuery.getQuery()}`;
            })
            .groupBy("recipient_id")
            .getRawMany();
    }

    public async getRefundedHtlcLockBalances(): Promise<{ senderPublicKey: string; refundedBalance: string }[]> {
        return this.createQueryBuilder()
            .select(`sender_public_key AS "senderPublicKey"`)
            .addSelect("SUM(amount)", "refundedBalance")
            .where(`type_group = ${Enums.TransactionTypeGroup.Core}`)
            .andWhere(`type = ${Enums.TransactionType.HtlcLock}`)
            .andWhere((qb) => {
                const refundedLockIdsSubQuery = qb
                    .subQuery()
                    .select("asset->'refund'->>'lockTransactionId'")
                    .from(Transaction, "t")
                    .where(`type_group = ${Enums.TransactionTypeGroup.Core}`)
                    .andWhere(`type = ${Enums.TransactionType.HtlcRefund}`);
                return `id IN ${refundedLockIdsSubQuery.getQuery()}`;
            })
            .groupBy("sender_public_key")
            .getRawMany();
    }
}
