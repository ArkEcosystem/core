import { Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { EntityRepository, In } from "typeorm";

import { Block, Round, Transaction } from "../models";
import { AbstractRepository } from "./abstract-repository";

@EntityRepository(Block)
export class BlockRepository extends AbstractRepository<Block> {
    public async findLatest(): Promise<Interfaces.IBlockData | undefined> {
        return (this.findOne({
            order: { height: "DESC" },
        }) as unknown) as Interfaces.IBlockData; // TODO: refactor
    }

    public async findRecent(limit: number): Promise<{ id: string }[]> {
        return this.find({
            select: ["id"],
            order: {
                timestamp: "DESC",
            },
            take: limit,
        });
    }

    public async findTop(limit: number): Promise<Block[]> {
        return this.find({
            order: {
                height: "DESC",
            },
            take: limit,
        });
    }

    public async findByHeight(height: number): Promise<Block | undefined> {
        return this.findOne({
            where: { height },
        });
    }

    public async findByHeights(heights: number[]): Promise<Block[]> {
        return this.find({
            where: { height: In(heights) },
        });
    }

    public async findByHeightRange(start: number, end: number): Promise<Block[]> {
        return this.createQueryBuilder()
            .where("height BETWEEN :start AND :end", { start, end })
            .orderBy("height")
            .getMany();
    }

    public async findByHeightRangeWithTransactionsForDownload(
        start: number,
        end: number,
    ): Promise<Contracts.Shared.DownloadBlock[]> {
        const blocks = await this.findByHeightRangeWithTransactionsRaw(start, end);
        return blocks.map((block) => {
            return this.rawToEntity(
                block,
                // @ts-ignore
                (entity: Block & { transactions: string[] }, _, value: Buffer[] | undefined) => {
                    if (value && value.length) {
                        entity.transactions = value.map((buffer) => buffer.toString("hex"));
                    } else {
                        entity.transactions = [];
                    }
                },
            );
        }) as Contracts.Shared.DownloadBlock[];
    }

    public async findByHeightRangeWithTransactions(start: number, end: number): Promise<Interfaces.IBlockData[]> {
        const blocks = await this.findByHeightRangeWithTransactionsRaw(start, end);
        return blocks.map((block) => {
            return this.rawToEntity(
                block,
                // @ts-ignore
                (entity: Block & { transactions: Interfaces.ITransactionData[] }, _, value: Buffer[] | undefined) => {
                    if (value && value.length) {
                        entity.transactions = value.map(
                            (buffer) => Transactions.TransactionFactory.fromBytesUnsafe(buffer).data,
                        );
                    } else {
                        entity.transactions = [];
                    }
                },
            );
        });
    }

    public async getStatistics(): Promise<{
        numberOfTransactions: number;
        totalFee: string;
        totalAmount: string;
        count: number;
    }> {
        return this.createQueryBuilder()
            .select([])
            .addSelect("COALESCE(SUM(number_of_transactions), 0)", "numberOfTransactions")
            .addSelect("COALESCE(SUM(total_fee), 0)", "totalFee")
            .addSelect("COALESCE(SUM(total_amount), 0)", "totalAmount")
            .addSelect("COUNT(DISTINCT(height))", "count")
            .getRawOne();
    }

    public async getBlockRewards(): Promise<{ generatorPublicKey: string; rewards: string }[]> {
        return this.createQueryBuilder()
            .select([])
            .addSelect("generator_public_key", "generatorPublicKey")
            .addSelect("SUM(reward + total_fee)", "rewards")
            .groupBy("generator_public_key")
            .getRawMany();
    }

    public async getDelegatesForgedBlocks(): Promise<
        { generatorPublicKey: string; totalRewards: string; totalFees: string; totalProduced: number }[]
    > {
        return this.createQueryBuilder()
            .select([])
            .addSelect("generator_public_key", "generatorPublicKey")
            .addSelect("SUM(total_fee)", "totalFees")
            .addSelect("SUM(reward)", "totalRewards")
            .addSelect("COUNT(total_amount)", "totalProduced")
            .groupBy("generator_public_key")
            .getRawMany();
    }

    public async getLastForgedBlocks(): Promise<
        { id: string; height: string; generatorPublicKey: string; timestamp: number }[]
    > {
        return this.query(`SELECT id,
                        height,
                        generator_public_key AS "generatorPublicKey",
                        TIMESTAMP
                FROM blocks
                WHERE height IN (
                SELECT MAX(height) AS last_block_height
                FROM blocks
                GROUP BY generator_public_key
                )
                ORDER BY TIMESTAMP DESC
        `);

        // TODO: subquery
        // return this.createQueryBuilder()
        //     .select(["id", "height", "timestamp"])
        //     .addSelect("generator_public_key", "generatorPublicKey")
        //     .groupBy("generator_public_key")
        //     .orderBy("timestamp", "DESC")
        //     .getRawMany();
    }

    public async saveBlocks(blocks: Interfaces.IBlock[]): Promise<void> {
        return this.manager.transaction(async (manager) => {
            const blockEntities: Block[] = [];
            const transactionEntities: Transaction[] = [];

            for (const block of blocks) {
                const blockEntity = Object.assign(new Block(), {
                    ...block.data,
                });

                if (block.transactions.length > 0) {
                    const transactions = block.transactions
                        .map((tx) =>
                            Object.assign(new Transaction(), {
                                ...tx.data,
                                timestamp: tx.timestamp,
                                serialized: tx.serialized,
                            }),
                        )
                        .sort((a: Transaction, b: Transaction) => {
                            return a.sequence - b.sequence;
                        });

                    transactionEntities.push(...transactions);
                }

                blockEntities.push(blockEntity);
            }

            await manager.save<Block>(blockEntities);
            await manager.save<Transaction>(transactionEntities);
        });
    }

    public async deleteBlocks(blocks: Interfaces.IBlockData[]): Promise<void> {
        const continuousChunk = blocks.every((block, i, arr) => {
            return i === 0 ? true : block.height - arr[i - 1].height === 1;
        });

        if (!continuousChunk) {
            throw new Error("Blocks chunk to delete isn't continuous");
        }

        return this.manager.transaction(async (manager) => {
            const lastBlockHeight: number = blocks[blocks.length - 1].height;
            const targetBlockHeight: number = blocks[0].height - 1;
            const roundInfo = Utils.roundCalculator.calculateRound(targetBlockHeight);
            const targetRound = roundInfo.round;
            const blockIds = blocks.map((b) => b.id);

            const afterLastBlockCount = await manager
                .createQueryBuilder()
                .select()
                .from(Block, "blocks")
                .where("blocks.height > :lastBlockHeight", { lastBlockHeight })
                .getCount();

            if (afterLastBlockCount !== 0) {
                throw new Error("Removing blocks from the middle");
            }

            await manager
                .createQueryBuilder()
                .delete()
                .from(Transaction)
                .where("block_id IN (:...blockIds)", { blockIds })
                .execute();

            const deleteBlocksResult = await manager
                .createQueryBuilder()
                .delete()
                .from(Block)
                .where("id IN (:...blockIds)", { blockIds })
                .execute();

            if (deleteBlocksResult.affected !== blockIds.length) {
                throw new Error("Failed to delete all blocks from database");
            }

            await manager
                .createQueryBuilder()
                .delete()
                .from(Round)
                .where("round > :targetRound", { targetRound })
                .execute();
        });
    }

    public async deleteTopBlocks(count: number): Promise<void> {
        await this.manager.transaction(async (manager) => {
            const maxHeightRow = await manager
                .createQueryBuilder()
                .select("MAX(height) AS max_height")
                .from(Block, "blocks")
                .getRawOne();

            const targetHeight = maxHeightRow["max_height"] - count;
            const roundInfo = Utils.roundCalculator.calculateRound(targetHeight);
            const targetRound = roundInfo.round;

            const blockIdRows = await manager
                .createQueryBuilder()
                .select(["id"])
                .from(Block, "blocks")
                .where("height > :targetHeight", { targetHeight })
                .getRawMany();

            const blockIds = blockIdRows.map((row) => row["id"]);

            if (blockIds.length !== count) {
                throw new Error("Corrupt database");
            }

            await manager
                .createQueryBuilder()
                .delete()
                .from(Transaction)
                .where("block_id IN (:...blockIds)", { blockIds })
                .execute();

            await manager
                .createQueryBuilder()
                .delete()
                .from(Block)
                .where("id IN (:...blockIds)", { blockIds })
                .execute();

            await manager
                .createQueryBuilder()
                .delete()
                .from(Round)
                .where("round > :targetRound", { targetRound })
                .execute();
        });
    }

    private async findByHeightRangeWithTransactionsRaw(start: number, end: number): Promise<Interfaces.IBlockData[]> {
        const [query, parameters] = this.manager.connection.driver.escapeQueryWithParameters(
            `
                SELECT *,
                    ARRAY
                        (SELECT serialized
                        FROM transactions
                        WHERE transactions.block_id = blocks.id
                        ORDER BY transactions.sequence ASC
                    ) AS transactions
                FROM blocks
                WHERE height
                    BETWEEN :start AND :end
                ORDER BY height ASC
            `,
            { start, end },
            {},
        );

        return this.query(query, parameters);
    }
}
