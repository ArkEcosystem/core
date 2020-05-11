import { Blocks, CryptoManager } from "@arkecosystem/core-crypto";
import { Contracts, Utils } from "@arkecosystem/core-kernel";
import dayjs from "dayjs";
import { EntityRepository, In } from "typeorm";

import { Transaction } from "../models";
import { AbstractEntityRepository } from "./repository";

@EntityRepository(Transaction)
export class TransactionRepository extends AbstractEntityRepository<Transaction> {
    public getWalletRepository!: () => Contracts.State.WalletRepository;

    public constructor(private cryptoManager: CryptoManager) {
        super();
    }

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

        const age = this.cryptoManager.LibraryManager.Crypto.Slots.getTime(dayjs().subtract(days, "day").valueOf());

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
            .addSelect((subQuery) => {
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
        const lockedIds = this.createQueryBuilder().select("id").where("type = 9").andWhere("type_group = 1");

        return this.createQueryBuilder()
            .select("recipient_id")
            .addSelect("SUM(amount)", "amount")
            .where("id IN (" + lockedIds.getQuery() + ")")
            .groupBy("recipient_id")
            .getRawMany();
    }

    public async getRefundedHtlcLockBalances(): Promise<{ amount: string; senderPublicKey: string }[]> {
        const lockedIds = this.createQueryBuilder().select("id").where("type = 10").andWhere("type_group = 1");

        return this.createQueryBuilder()
            .select("sender_public_key")
            .addSelect("SUM(amount)", "amount")
            .where("id IN (" + lockedIds.getQuery() + ")")
            .groupBy("sender_public_key")
            .getRawMany();
    }
}
