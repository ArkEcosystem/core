import { Container, Contracts, Enums } from "@arkecosystem/core-kernel";
import { Blocks, Interfaces, Transactions } from "@arkecosystem/crypto";
import { Connection } from "typeorm";

import { DatabaseEvent } from "./events";
import { Round } from "./models";
import { BlockRepository } from "./repositories/block-repository";
import { RoundRepository } from "./repositories/round-repository";
import { TransactionRepository } from "./repositories/transaction-repository";

// TODO: maybe we should introduce `BlockLike`, `TransactionLike`, `RoundLke` interfaces to remove the need to cast
@Container.injectable()
export class DatabaseService {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.DatabaseConnection)
    private readonly connection!: Connection;

    @Container.inject(Container.Identifiers.DatabaseBlockRepository)
    private readonly blockRepository!: BlockRepository;

    @Container.inject(Container.Identifiers.DatabaseTransactionRepository)
    private readonly transactionRepository!: TransactionRepository;

    @Container.inject(Container.Identifiers.DatabaseRoundRepository)
    private readonly roundRepository!: RoundRepository;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly events!: Contracts.Kernel.EventDispatcher;

    public async initialize(): Promise<void> {
        try {
            if (process.env.CORE_RESET_DATABASE) {
                await this.reset();
            }
        } catch (error) {
            this.logger.error(error.stack);
            this.app.terminate("Failed to initialize database service.", error);
        }
    }

    public async disconnect(): Promise<void> {
        this.logger.debug("Disconnecting from database");

        this.events.dispatch(DatabaseEvent.PRE_DISCONNECT);

        await this.connection.close();

        this.events.dispatch(DatabaseEvent.POST_DISCONNECT);
        this.logger.debug("Disconnected from database");
    }

    public async reset(): Promise<void> {
        await this.connection.query("TRUNCATE TABLE blocks, rounds, transactions RESTART IDENTITY;");
    }

    public async getBlock(id: string): Promise<Interfaces.IBlock | undefined> {
        // TODO: caching the last 1000 blocks, in combination with `saveBlock` could help to optimise
        const block: Interfaces.IBlockData = ((await this.blockRepository.findOne(
            id,
        )) as unknown) as Interfaces.IBlockData;

        if (!block) {
            return undefined;
        }

        const transactions: Array<{
            serialized: Buffer;
            id: string;
        }> = await this.transactionRepository.find({ blockId: block.id });

        block.transactions = transactions.map(
            ({ serialized, id }) => Transactions.TransactionFactory.fromBytesUnsafe(serialized, id).data,
        );

        return Blocks.BlockFactory.fromData(block, {
            deserializeTransactionsUnchecked: true,
        });
    }

    // ! three methods below (getBlocks, getBlocksForDownload, getBlocksByHeight) can be merged into one

    public async getBlocks(start: number, end: number, headersOnly?: boolean): Promise<Interfaces.IBlockData[]> {
        // ! assumes that earlier blocks may be missing
        // ! but querying database is unnecessary when later blocks are missing too (aren't forged yet)
        return headersOnly
            ? await this.blockRepository.findByHeightRange(start, end)
            : await this.blockRepository.findByHeightRangeWithTransactions(start, end);
    }

    // TODO: move to block repository
    public async getBlocksForDownload(
        offset: number,
        limit: number,
        headersOnly?: boolean,
    ): Promise<Contracts.Shared.DownloadBlock[]> {
        // ! method is identical to getBlocks, but skips faster stateStore.getLastBlocksByHeight

        if (headersOnly) {
            return (this.blockRepository.findByHeightRange(offset, offset + limit - 1) as unknown) as Promise<
                Contracts.Shared.DownloadBlock[]
            >;
        }

        // TODO: fix types
        return (this.blockRepository.findByHeightRangeWithTransactionsForDownload(
            offset,
            offset + limit - 1,
        ) as unknown) as Promise<Contracts.Shared.DownloadBlock[]>;
    }

    public async findBlockByHeights(heights: number[]) {
        return await this.blockRepository.findByHeights(heights);
    }

    public async getLastBlock(): Promise<Interfaces.IBlock> {
        const block: Interfaces.IBlockData | undefined = await this.blockRepository.findLatest();

        if (!block) {
            // @ts-ignore Technically, this cannot happen
            // ! but this is public method so it can happen
            return undefined;
        }

        const transactions: Array<{
            id: string;
            blockId: string;
            serialized: Buffer;
        }> = await this.transactionRepository.findByBlockIds([block.id!]);

        block.transactions = transactions.map(
            ({ serialized, id }) => Transactions.TransactionFactory.fromBytesUnsafe(serialized, id).data,
        );

        const lastBlock: Interfaces.IBlock = Blocks.BlockFactory.fromData(block, {
            deserializeTransactionsUnchecked: true,
        })!;

        return lastBlock;
    }

    public async getTopBlocks(count: number): Promise<Interfaces.IBlockData[]> {
        // ! blockRepository.findTop returns blocks in reverse order
        // ! where recent block is first in array
        const blocks: Interfaces.IBlockData[] = ((await this.blockRepository.findTop(
            count,
        )) as unknown) as Interfaces.IBlockData[];

        await this.loadTransactionsForBlocks(blocks);

        return blocks;
    }

    public async getTransaction(id: string) {
        return this.transactionRepository.findOne(id);
    }

    public async deleteBlocks(blocks: Interfaces.IBlockData[]): Promise<void> {
        return await this.blockRepository.deleteBlocks(blocks);
    }

    public async saveBlocks(blocks: Interfaces.IBlock[]): Promise<void> {
        return await this.blockRepository.saveBlocks(blocks);
    }

    public async findLatestBlock(): Promise<Interfaces.IBlockData | undefined> {
        return await this.blockRepository.findLatest();
    }

    public async findBlockByID(ids: any[]): Promise<Interfaces.IBlockData[] | undefined> {
        return ((await this.blockRepository.findByIds(ids)) as unknown) as Interfaces.IBlockData[];
    }

    public async findRecentBlocks(limit: number): Promise<{ id: string }[]> {
        return await this.blockRepository.findRecent(limit);
    }

    public async getRound(round: number): Promise<Round[]> {
        return await this.roundRepository.getRound(round);
    }

    public async saveRound(activeDelegates: readonly Contracts.State.Wallet[]): Promise<void> {
        this.logger.info(`Saving round ${activeDelegates[0].getAttribute("delegate.round").toLocaleString()}`);

        await this.roundRepository.save(activeDelegates);

        this.events.dispatch(Enums.RoundEvent.Created, activeDelegates);
    }

    public async deleteRound(round: number): Promise<void> {
        await this.roundRepository.deleteFrom(round);
    }

    public async verifyBlockchain(lastBlock?: Interfaces.IBlock): Promise<boolean> {
        const errors: string[] = [];

        const block: Interfaces.IBlock = lastBlock ? lastBlock : await this.getLastBlock();

        // Last block is available
        if (!block) {
            errors.push("Last block is not available");
        } else {
            // ! can be checked using blockStats.count instead
            const numberOfBlocks: number = await this.blockRepository.count();

            // Last block height equals the number of stored blocks
            if (block.data.height !== +numberOfBlocks) {
                errors.push(
                    `Last block height: ${block.data.height.toLocaleString()}, number of stored blocks: ${numberOfBlocks}`,
                );
            }
        }

        const blockStats: {
            numberOfTransactions: number;
            totalFee: string;
            totalAmount: string;
            count: number;
        } = await this.blockRepository.getStatistics();

        const transactionStats: {
            count: number;
            totalFee: string;
            totalAmount: string;
        } = await this.transactionRepository.getStatistics();

        // Number of stored transactions equals the sum of block.numberOfTransactions in the database
        if (blockStats.numberOfTransactions !== transactionStats.count) {
            errors.push(
                `Number of transactions: ${transactionStats.count}, number of transactions included in blocks: ${blockStats.numberOfTransactions}`,
            );
        }

        // Sum of all tx fees equals the sum of block.totalFee
        if (blockStats.totalFee !== transactionStats.totalFee) {
            errors.push(
                `Total transaction fees: ${transactionStats.totalFee}, total of block.totalFee : ${blockStats.totalFee}`,
            );
        }

        // Sum of all tx amount equals the sum of block.totalAmount
        if (blockStats.totalAmount !== transactionStats.totalAmount) {
            errors.push(
                `Total transaction amounts: ${transactionStats.totalAmount}, total of block.totalAmount : ${blockStats.totalAmount}`,
            );
        }

        const hasErrors: boolean = errors.length > 0;

        if (hasErrors) {
            this.logger.error("FATAL: The database is corrupted");
            this.logger.error(JSON.stringify(errors, undefined, 4));
        }

        return !hasErrors;
    }

    private async loadTransactionsForBlocks(blocks: Interfaces.IBlockData[]): Promise<void> {
        const dbTransactions: Array<{
            id: string;
            blockId: string;
            serialized: Buffer;
        }> = await this.getTransactionsForBlocks(blocks);

        const transactions = dbTransactions.map((tx) => {
            const { data } = Transactions.TransactionFactory.fromBytesUnsafe(tx.serialized, tx.id);
            data.blockId = tx.blockId;
            return data;
        });

        for (const block of blocks) {
            if (block.numberOfTransactions > 0) {
                block.transactions = transactions.filter((transaction) => transaction.blockId === block.id);
            }
        }
    }

    private async getTransactionsForBlocks(
        blocks: Interfaces.IBlockData[],
    ): Promise<
        Array<{
            id: string;
            blockId: string;
            serialized: Buffer;
        }>
    > {
        if (!blocks.length) {
            return [];
        }

        const ids: string[] = blocks.map((block: Interfaces.IBlockData) => block.id!);
        return this.transactionRepository.findByBlockIds(ids);
    }
}
