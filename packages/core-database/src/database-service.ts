import { Container, Contracts, Enums, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Blocks, Crypto, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import assert from "assert";
import { Connection } from "typeorm";

import { DatabaseEvent } from "./events";
import { BlockRepository } from "./repositories/block-repository";
import { RoundRepository } from "./repositories/round-repository";
import { TransactionRepository } from "./repositories/transaction-repository";

// TODO: maybe we should introduce `BlockLike`, `TransactionLike`, `RoundLke` interfaces to remove the need to cast
@Container.injectable()
export class DatabaseService {
    // TODO: make private readonly
    public blocksInCurrentRound: Interfaces.IBlock[] | undefined = undefined;
    // TODO: make private readonly
    public restoredDatabaseIntegrity: boolean = false;
    // TODO: make private readonly
    public forgingDelegates: Contracts.State.Wallet[] | undefined = undefined;

    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.DatabaseConnection)
    private readonly connection!: Connection;

    @Container.inject(Container.Identifiers.BlockRepository)
    private readonly blockRepository!: BlockRepository;

    @Container.inject(Container.Identifiers.TransactionRepository)
    private readonly transactionRepository!: TransactionRepository;

    @Container.inject(Container.Identifiers.RoundRepository)
    private readonly roundRepository!: RoundRepository;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.BlockState)
    @Container.tagged("state", "blockchain")
    private readonly blockState!: Contracts.State.BlockState;

    @Container.inject(Container.Identifiers.DposState)
    @Container.tagged("state", "blockchain")
    private readonly dposState!: Contracts.State.DposState;

    @Container.inject(Container.Identifiers.DposPreviousRoundStateProvider)
    private readonly getDposPreviousRoundState!: Contracts.State.DposPreviousRoundStateProvider;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter!: Contracts.Kernel.EventDispatcher;

    public async initialize(): Promise<void> {
        if (process.env.CORE_ENV === "test") {
            Managers.configManager.getMilestone().aip11 = false;
            Managers.configManager.getMilestone().htlcEnabled = false;
        }

        try {
            this.emitter.dispatch(Enums.StateEvent.Starting);

            this.app
                .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
                .setGenesisBlock(Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"))!);

            if (process.env.CORE_RESET_DATABASE) {
                await this.reset();
            }

            await this.initializeLastBlock();
            await this.loadBlocksFromCurrentRound();
        } catch (error) {
            this.logger.error(error.stack);
            this.app.terminate("Failed to initialize database service.", error);
        }
    }

    public async disconnect(): Promise<void> {
        this.logger.debug("Disconnecting from database");

        this.emitter.dispatch(DatabaseEvent.PRE_DISCONNECT);

        await this.connection.close();

        this.emitter.dispatch(DatabaseEvent.POST_DISCONNECT);
        this.logger.debug("Disconnected from database");
    }

    public async restoreCurrentRound(height: number): Promise<void> {
        await this.initializeActiveDelegates(height);
        await this.applyRound(height);
    }

    public async reset(): Promise<void> {
        await this.connection.query("TRUNCATE TABLE blocks, rounds, transactions RESTART IDENTITY;");
        await this.createGenesisBlock();
    }

    // TODO: move out of core-database to get rid of BlockState dependency
    public async applyBlock(block: Interfaces.IBlock): Promise<void> {
        await this.blockState.applyBlock(block);

        if (this.blocksInCurrentRound) {
            this.blocksInCurrentRound.push(block);
        }

        this.detectMissedBlocks(block);

        await this.applyRound(block.data.height);

        for (const transaction of block.transactions) {
            await this.emitTransactionEvents(transaction);
        }

        this.detectMissedBlocks(block);

        this.emitter.dispatch(Enums.BlockEvent.Applied, block.data);
    }

    // TODO: move out of core-database to get rid of WalletState dependency
    public async applyRound(height: number): Promise<void> {
        const nextHeight: number = height === 1 ? 1 : height + 1;

        if (AppUtils.roundCalculator.isNewRound(nextHeight)) {
            const roundInfo: Contracts.Shared.RoundInfo = AppUtils.roundCalculator.calculateRound(nextHeight);
            const { round } = roundInfo;

            if (
                nextHeight === 1 ||
                !this.forgingDelegates ||
                this.forgingDelegates.length === 0 ||
                this.forgingDelegates[0].getAttribute<number>("delegate.round") !== round
            ) {
                this.logger.info(`Starting Round ${roundInfo.round.toLocaleString()}`);

                try {
                    if (nextHeight > 1) {
                        this.detectMissedRound(this.forgingDelegates!);
                    }

                    this.dposState.buildDelegateRanking();
                    this.dposState.setDelegatesRound(roundInfo);

                    await this.setForgingDelegatesOfRound(roundInfo, this.dposState.getRoundDelegates().slice());
                    await this.saveRound(this.dposState.getRoundDelegates());

                    this.blocksInCurrentRound!.length = 0;

                    this.emitter.dispatch(Enums.RoundEvent.Applied);
                } catch (error) {
                    // trying to leave database state has it was
                    await this.deleteRound(round);

                    throw error;
                }
            } else {
                this.logger.warning(
                    `Round ${round.toLocaleString()} has already been applied. This should happen only if you are a forger.`,
                );
            }
        }
    }

    public async buildWallets(): Promise<void> {
        //this.walletRepository.reset();
    }

    public async getActiveDelegates(
        roundInfo?: Contracts.Shared.RoundInfo,
        delegates?: Contracts.State.Wallet[],
    ): Promise<Contracts.State.Wallet[]> {
        if (!roundInfo) {
            const lastBlock = await this.getLastBlock();
            roundInfo = AppUtils.roundCalculator.calculateRound(lastBlock.data.height);
        }

        const { round } = roundInfo;

        if (
            this.forgingDelegates &&
            this.forgingDelegates.length &&
            this.forgingDelegates[0].getAttribute<number>("delegate.round") === round
        ) {
            return this.forgingDelegates;
        }

        // When called during applyRound we already know the delegates, so we don't have to query the database.
        if (!delegates || delegates.length === 0) {
            delegates = (await this.roundRepository.find({ round })).map(({ publicKey, balance }) => {
                const wallet = this.walletRepository.createWallet(Identities.Address.fromPublicKey(publicKey));
                wallet.publicKey = publicKey;
                wallet.setAttribute("delegate", {
                    delegate: {
                        voteBalance: Utils.BigNumber.make(balance),
                        username: this.walletRepository
                            .findByPublicKey(publicKey)
                            .getAttribute("delegate.username", ""),
                    },
                });
                return wallet;
            });
        }

        for (const delegate of delegates) {
            delegate.setAttribute("delegate.round", round);
        }

        const seedSource: string = round.toString();
        let currentSeed: Buffer = Crypto.HashAlgorithms.sha256(seedSource);

        delegates = delegates.map(delegate => delegate.clone());
        for (let i = 0, delCount = delegates.length; i < delCount; i++) {
            for (let x = 0; x < 4 && i < delCount; i++, x++) {
                const newIndex = currentSeed[x] % delCount;
                const b = delegates[newIndex];
                delegates[newIndex] = delegates[i];
                delegates[i] = b;
            }
            currentSeed = Crypto.HashAlgorithms.sha256(currentSeed);
        }

        return delegates;
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

        return Blocks.BlockFactory.fromData(block);
    }

    public async getBlocks(offset: number, limit: number, headersOnly?: boolean): Promise<Interfaces.IBlockData[]> {
        // The functions below return matches in the range [start, end], including both ends.
        const start: number = offset;
        const end: number = offset + limit - 1;

        let blocks: Interfaces.IBlockData[] = this.app
            .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
            .getLastBlocksByHeight(start, end, headersOnly);

        if (blocks.length !== limit) {
            blocks = headersOnly
                ? await this.blockRepository.findByHeightRange(start, end)
                : await this.blockRepository.findByHeightRangeWithTransactions(start, end);
        }

        return blocks;
    }

    // TODO: move to block repository
    public async getBlocksForDownload(
        offset: number,
        limit: number,
        headersOnly?: boolean,
    ): Promise<Contracts.Shared.DownloadBlock[]> {
        if (headersOnly) {
            return (this.blockRepository.findByHeightRange(offset, offset + limit - 1) as unknown) as Promise<
                Contracts.Shared.DownloadBlock[]
            >;
        }

        // TODO: fix types
        return (this.blockRepository.findByHeightRangeWithTransactions(
            offset,
            offset + limit - 1,
        ) as unknown) as Promise<Contracts.Shared.DownloadBlock[]>;
    }

    /**
     * Get the blocks at the given heights.
     * The transactions for those blocks will not be loaded like in `getBlocks()`.
     * @param {Array} heights array of arbitrary block heights
     * @return {Array} array for the corresponding blocks. The element (block) at index `i`
     * in the resulting array corresponds to the requested height at index `i` in the input
     * array heights[]. For example, if
     * heights[0] = 100
     * heights[1] = 200
     * heights[2] = 150
     * then the result array will have the same number of elements (3) and will be:
     * result[0] = block at height 100
     * result[1] = block at height 200
     * result[2] = block at height 150
     * If some of the requested blocks do not exist in our chain (requested height is larger than
     * the height of our blockchain), then that element will be `undefined` in the resulting array
     * @throws Error
     */
    public async getBlocksByHeight(heights: number[]) {
        // TODO: add type
        const blocks: Interfaces.IBlockData[] = [];

        // Map of height -> index in heights[], e.g. if
        // heights[5] == 6000000, then
        // toGetFromDB[6000000] == 5
        // In this map we only store a subset of the heights - the ones we could not retrieve
        // from app/state and need to get from the database.
        const toGetFromDB = {};

        for (const [i, height] of heights.entries()) {
            const stateBlocks = this.app
                .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
                .getLastBlocksByHeight(height, height, true);

            if (Array.isArray(stateBlocks) && stateBlocks.length > 0) {
                blocks[i] = stateBlocks[0];
            }

            if (blocks[i] === undefined) {
                toGetFromDB[height] = i;
            }
        }

        const heightsToGetFromDB: number[] = Object.keys(toGetFromDB).map(height => +height);
        if (heightsToGetFromDB.length > 0) {
            const blocksByHeights = await this.blockRepository.findByHeights(heightsToGetFromDB);

            for (const blockFromDB of blocksByHeights) {
                const index = toGetFromDB[blockFromDB.height];
                blocks[index] = blockFromDB;
            }
        }

        return blocks;
    }

    public async getBlocksForRound(roundInfo?: Contracts.Shared.RoundInfo): Promise<Interfaces.IBlock[]> {
        let lastBlock: Interfaces.IBlock = this.app
            .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
            .getLastBlock();

        if (!lastBlock) {
            lastBlock = await this.getLastBlock();
        }

        if (!lastBlock) {
            return [];
        } else if (lastBlock.data.height === 1) {
            return [lastBlock];
        }

        if (!roundInfo) {
            roundInfo = AppUtils.roundCalculator.calculateRound(lastBlock.data.height);
        }

        return (await this.getBlocks(roundInfo.roundHeight, roundInfo.maxDelegates)).map(
            (block: Interfaces.IBlockData) => {
                if (block.height === 1) {
                    return this.app.get<any>(Container.Identifiers.StateStore).getGenesisBlock();
                }

                return Blocks.BlockFactory.fromData(block, { deserializeTransactionsUnchecked: true });
            },
        );
    }

    public async getLastBlock(): Promise<Interfaces.IBlock> {
        const block: Interfaces.IBlockData | undefined = await this.blockRepository.findLatest();

        if (!block) {
            // @ts-ignore Technically, this cannot happen
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

        const lastBlock: Interfaces.IBlock = Blocks.BlockFactory.fromData(block)!;

        if (block.height === 1 && process.env.CORE_ENV === "test") {
            Managers.configManager.getMilestone().aip11 = true;
            Managers.configManager.getMilestone().htlcEnabled = true;
        }

        return lastBlock;
    }

    public async getCommonBlocks(ids: string[]): Promise<Interfaces.IBlockData[]> {
        let commonBlocks: Interfaces.IBlockData[] = this.app
            .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
            .getCommonBlocks(ids);

        if (commonBlocks.length < ids.length) {
            commonBlocks = ((await this.blockRepository.findCommon(ids)) as unknown) as Interfaces.IBlockData[];
        }

        return commonBlocks;
    }

    public async getRecentBlockIds(): Promise<string[]> {
        let blocks: any[] = this.app
            .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
            .getLastBlockIds()
            .reverse()
            .slice(0, 10);

        if (blocks.length < 10) {
            blocks = await this.blockRepository.findRecent(10);
        }

        return blocks.map(block => block.id);
    }

    public async getTopBlocks(count: number): Promise<Interfaces.IBlockData[]> {
        const blocks: Interfaces.IBlockData[] = ((await this.blockRepository.findTop(
            count,
        )) as unknown) as Interfaces.IBlockData[];

        await this.loadTransactionsForBlocks(blocks);

        return blocks;
    }

    public async getTransaction(id: string) {
        return this.transactionRepository.findOne(id);
    }

    public async loadBlocksFromCurrentRound(): Promise<void> {
        this.blocksInCurrentRound = await this.getBlocksForRound();
    }

    public async revertBlock(block: Interfaces.IBlock): Promise<void> {
        await this.revertRound(block.data.height);
        await this.blockState.revertBlock(block);

        assert(this.blocksInCurrentRound!.pop()!.data.id === block.data.id);

        for (let i = block.transactions.length - 1; i >= 0; i--) {
            this.emitter.dispatch(Enums.TransactionEvent.Reverted, block.transactions[i].data);
        }

        this.emitter.dispatch(Enums.BlockEvent.Reverted, block.data);
    }

    public async revertRound(height: number): Promise<void> {
        const roundInfo: Contracts.Shared.RoundInfo = AppUtils.roundCalculator.calculateRound(height);
        const { round, nextRound, maxDelegates } = roundInfo;

        if (nextRound === round + 1 && height >= maxDelegates) {
            this.logger.info(`Back to previous round: ${round.toLocaleString()}`);

            this.blocksInCurrentRound = await this.getBlocksForRound(roundInfo);

            await this.setForgingDelegatesOfRound(
                roundInfo,
                await this.calcPreviousActiveDelegates(roundInfo, this.blocksInCurrentRound),
            );

            await this.deleteRound(nextRound);
        }
    }

    public async saveRound(activeDelegates: readonly Contracts.State.Wallet[]): Promise<void> {
        this.logger.info(`Saving round ${activeDelegates[0].getAttribute("delegate.round").toLocaleString()}`);

        await this.roundRepository.save(activeDelegates);

        this.emitter.dispatch(Enums.RoundEvent.Created, activeDelegates);
    }

    public async deleteRound(round: number): Promise<void> {
        await this.roundRepository.delete({ round });
    }

    public async verifyBlockchain(): Promise<boolean> {
        const errors: string[] = [];

        const lastBlock: Interfaces.IBlock = this.app.get<any>(Container.Identifiers.StateStore).getLastBlock();

        // Last block is available
        if (!lastBlock) {
            errors.push("Last block is not available");
        } else {
            const numberOfBlocks: number = await this.blockRepository.count();

            // Last block height equals the number of stored blocks
            if (lastBlock.data.height !== +numberOfBlocks) {
                errors.push(
                    `Last block height: ${lastBlock.data.height.toLocaleString()}, number of stored blocks: ${numberOfBlocks}`,
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

    // TODO: move to somewhere else
    // public async verifyTransaction(transaction: Interfaces.ITransaction): Promise<boolean> {
    //     const senderId: string = Identities.Address.fromPublicKey(transaction.data.senderPublicKey);

    //     const sender: Contracts.State.Wallet = this.walletRepository.findByAddress(senderId);
    //     const transactionHandler: Handlers.TransactionHandler = await this.app
    //         .get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry)
    //         .get(transaction.data);

    //     if (!sender.publicKey) {
    //         sender.publicKey = transaction.data.senderPublicKey;

    //         this.walletRepository.reindex(sender);
    //     }

    //     const dbTransaction = await this.getTransaction(transaction.data.id);

    //     try {
    //         await transactionHandler.throwIfCannotBeApplied(transaction, sender, this.walletRepository);
    //         return !dbTransaction;
    //     } catch {
    //         return false;
    //     }
    // }

    private detectMissedBlocks(block: Interfaces.IBlock) {
        const lastBlock: Interfaces.IBlock = this.app.get<any>(Container.Identifiers.StateStore).getLastBlock();

        if (lastBlock.data.height === 1) {
            return;
        }

        const lastSlot: number = Crypto.Slots.getSlotNumber(lastBlock.data.timestamp);
        const currentSlot: number = Crypto.Slots.getSlotNumber(block.data.timestamp);

        const missedSlots: number = Math.min(currentSlot - lastSlot - 1, this.forgingDelegates!.length);
        for (let i = 0; i < missedSlots; i++) {
            const missedSlot: number = lastSlot + i + 1;
            const delegate: Contracts.State.Wallet = this.forgingDelegates![missedSlot % this.forgingDelegates!.length];

            this.logger.debug(
                `Delegate ${delegate.getAttribute("delegate.username")} (${delegate.publicKey}) just missed a block.`,
            );

            this.emitter.dispatch(Enums.ForgerEvent.Missing, {
                delegate,
            });
        }
    }

    private async initializeLastBlock(): Promise<void> {
        let lastBlock: Interfaces.IBlock | undefined;
        let tries = 5;

        // Ensure the config manager is initialized, before attempting to call `fromData`
        // which otherwise uses potentially wrong milestones.
        let lastHeight: number = 1;
        const latest: Interfaces.IBlockData | undefined = await this.blockRepository.findLatest();
        if (latest) {
            lastHeight = latest.height;
        }

        Managers.configManager.setHeight(lastHeight);

        const getLastBlock = async (): Promise<Interfaces.IBlock | undefined> => {
            try {
                return await this.getLastBlock();
            } catch (error) {
                this.logger.error(error.message);

                if (tries > 0) {
                    const block: Interfaces.IBlockData = (await this.blockRepository.findLatest())!;
                    await this.blockRepository.deleteBlocks([block]);
                    tries--;
                } else {
                    this.app.terminate("Unable to deserialize last block from database.", error);
                    return undefined;
                }

                return getLastBlock();
            }
        };

        lastBlock = await getLastBlock();

        if (!lastBlock) {
            this.logger.warning("No block found in database");
            lastBlock = await this.createGenesisBlock();
        }

        if (process.env.CORE_ENV === "test") {
            Managers.configManager.getMilestone().aip11 = true;
            Managers.configManager.getMilestone().htlcEnabled = true;
        }

        this.configureState(lastBlock);
    }

    private async loadTransactionsForBlocks(blocks: Interfaces.IBlockData[]): Promise<void> {
        const dbTransactions: Array<{
            id: string;
            blockId: string;
            serialized: Buffer;
        }> = await this.getTransactionsForBlocks(blocks);

        const transactions = dbTransactions.map(tx => {
            const { data } = Transactions.TransactionFactory.fromBytesUnsafe(tx.serialized, tx.id);
            data.blockId = tx.blockId;
            return data;
        });

        for (const block of blocks) {
            if (block.numberOfTransactions > 0) {
                block.transactions = transactions.filter(transaction => transaction.blockId === block.id);
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

    private async createGenesisBlock(): Promise<Interfaces.IBlock> {
        const genesisBlock: Interfaces.IBlock = this.app
            .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
            .getGenesisBlock();

        await this.blockRepository.saveBlocks([genesisBlock]);

        return genesisBlock;
    }

    private configureState(lastBlock: Interfaces.IBlock): void {
        this.app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore).setLastBlock(lastBlock);

        const { blocktime, block } = Managers.configManager.getMilestone();

        const blocksPerDay: number = Math.ceil(86400 / blocktime);
        this.app.get<any>(Container.Identifiers.StateBlockStore).resize(blocksPerDay);
        this.app.get<any>(Container.Identifiers.StateTransactionStore).resize(blocksPerDay * block.maxTransactions);
    }

    private detectMissedRound(delegates: Contracts.State.Wallet[]): void {
        if (!delegates || !this.blocksInCurrentRound) {
            return;
        }

        if (this.blocksInCurrentRound.length === 1 && this.blocksInCurrentRound[0].data.height === 1) {
            return;
        }

        for (const delegate of delegates) {
            const producedBlocks: Interfaces.IBlock[] = this.blocksInCurrentRound.filter(
                blockGenerator => blockGenerator.data.generatorPublicKey === delegate.publicKey,
            );

            if (producedBlocks.length === 0) {
                const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(delegate.publicKey!);

                this.logger.debug(
                    `Delegate ${wallet.getAttribute("delegate.username")} (${wallet.publicKey}) just missed a round.`,
                );

                this.emitter.dispatch(Enums.RoundEvent.Missed, {
                    delegate: wallet,
                });
            }
        }
    }

    private async initializeActiveDelegates(height: number): Promise<void> {
        this.forgingDelegates = undefined;

        const roundInfo: Contracts.Shared.RoundInfo = AppUtils.roundCalculator.calculateRound(height);

        await this.setForgingDelegatesOfRound(roundInfo, await this.calcPreviousActiveDelegates(roundInfo));
    }

    private async setForgingDelegatesOfRound(
        roundInfo: Contracts.Shared.RoundInfo,
        delegates?: Contracts.State.Wallet[],
    ): Promise<void> {
        this.forgingDelegates = await this.getActiveDelegates(roundInfo, delegates);
    }

    private async calcPreviousActiveDelegates(
        roundInfo: Contracts.Shared.RoundInfo,
        blocks?: Interfaces.IBlock[],
    ): Promise<Contracts.State.Wallet[]> {
        blocks = blocks || (await this.getBlocksForRound(roundInfo));

        const prevRoundState = await this.getDposPreviousRoundState(blocks, roundInfo);
        for (const prevRoundDelegate of prevRoundState.getAllDelegates()) {
            const username = prevRoundDelegate.getAttribute("delegate.username");
            const delegateWallet = this.walletRepository.findByUsername(username);
            delegateWallet.setAttribute("delegate.rank", prevRoundDelegate.getAttribute("delegate.rank"));
        }
        return prevRoundState.getRoundDelegates().slice();
    }

    private async emitTransactionEvents(transaction: Interfaces.ITransaction): Promise<void> {
        this.emitter.dispatch(Enums.TransactionEvent.Applied, transaction.data);
        const handler = await this.app
            .getTagged<any>(Container.Identifiers.TransactionHandlerRegistry, "state", "blockchain")
            .getActivatedHandlerForData(transaction.data);
        handler.emitEvents(transaction, this.emitter);
    }
}
