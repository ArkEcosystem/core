import { app, Container, Contracts, Enums, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Blocks, Crypto, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import assert from "assert";

import { BlockState } from "./block-state";

export class DatabaseService implements Contracts.Database.DatabaseService {
    public connection: Contracts.Database.Connection;
    public walletRepository: Contracts.State.WalletRepository;
    public logger = app.log;
    public emitter = app.get<Contracts.Kernel.Events.EventDispatcher>(Container.Identifiers.EventDispatcherService);
    public options: any;
    public wallets: Contracts.Database.WalletsBusinessRepository;
    public blocksBusinessRepository: Contracts.Database.BlocksBusinessRepository;
    public transactionsBusinessRepository: Contracts.Database.TransactionsBusinessRepository;
    public blocksInCurrentRound: Interfaces.IBlock[] = undefined;
    public restoredDatabaseIntegrity: boolean = false;
    public forgingDelegates: Contracts.State.Wallet[] = undefined;
    public cache: Map<any, any> = new Map();

    public blockState; // @todo: private readonly
    public walletState; // @todo: private readonly

    constructor(
        options: Record<string, any>,
        connection: Contracts.Database.Connection,
        walletRepository: Contracts.State.WalletRepository,
        walletsBusinessRepository: Contracts.Database.WalletsBusinessRepository,
        transactionsBusinessRepository: Contracts.Database.TransactionsBusinessRepository,
        blocksBusinessRepository: Contracts.Database.BlocksBusinessRepository,
    ) {
        this.connection = connection;
        this.walletRepository = walletRepository;
        this.options = options;
        this.wallets = walletsBusinessRepository;
        this.blocksBusinessRepository = blocksBusinessRepository;
        this.transactionsBusinessRepository = transactionsBusinessRepository;

        // @todo: review and/or remove then after the core-db rewrite to loosen coupling
        this.blockState = app.resolve<BlockState>(BlockState).init(this.walletRepository);
        this.walletState = app.resolve<Wallets.WalletState>(Wallets.WalletState).init(this.walletRepository);
    }

    public async init(): Promise<void> {
        this.emitter.dispatch(Enums.Events.State.StateStarting, this);

        app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore).setGenesisBlock(
            Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock")),
        );

        if (process.env.CORE_RESET_DATABASE) {
            await this.reset();
        }

        await this.initializeLastBlock();

        try {
            await this.loadBlocksFromCurrentRound();
        } catch (error) {
            this.logger.warning(`Failed to load blocks from current round: ${error.message}`);
        }
    }

    public async restoreCurrentRound(height: number): Promise<void> {
        await this.initializeActiveDelegates(height);
        await this.applyRound(height);
    }

    public async reset(): Promise<void> {
        await this.connection.resetAll();
        await this.createGenesisBlock();
    }

    public async applyBlock(block: Interfaces.IBlock): Promise<void> {
        await this.blockState.applyBlock(block);

        if (this.blocksInCurrentRound) {
            this.blocksInCurrentRound.push(block);
        }

        await this.applyRound(block.data.height);

        for (const transaction of block.transactions) {
            await this.emitTransactionEvents(transaction);
        }

        this.detectMissedBlocks(block);

        this.emitter.dispatch(Enums.Events.State.BlockApplied, block.data);
    }

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
                        this.detectMissedRound(this.forgingDelegates);
                    }

                    const delegates: Contracts.State.Wallet[] = this.walletState.loadActiveDelegateList(roundInfo);

                    await this.setForgingDelegatesOfRound(roundInfo, delegates);
                    await this.saveRound(delegates);

                    this.blocksInCurrentRound.length = 0;

                    this.emitter.dispatch(Enums.Events.State.RoundApplied);
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
        this.walletRepository.reset();

        await this.connection.buildWallets();
    }

    public async deleteBlocks(blocks: Interfaces.IBlockData[]): Promise<void> {
        await this.connection.deleteBlocks(blocks);
    }

    public async deleteRound(round: number): Promise<void> {
        await this.connection.roundsRepository.delete(round);
    }

    public async getActiveDelegates(
        roundInfo: Contracts.Shared.RoundInfo,
        delegates?: Contracts.State.Wallet[],
    ): Promise<Contracts.State.Wallet[]> {
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
            delegates = (await this.connection.roundsRepository.findById(round)).map(({ publicKey, balance }) =>
                Object.assign(new Wallets.Wallet(Identities.Address.fromPublicKey(publicKey)), {
                    publicKey,
                    attributes: {
                        delegate: {
                            voteBalance: Utils.BigNumber.make(balance),
                            username: this.walletRepository
                                .findByPublicKey(publicKey)
                                .getAttribute("delegate.username"),
                        },
                    },
                }),
            );
        }

        for (const delegate of delegates) {
            delegate.setAttribute("delegate.round", round);
        }

        const seedSource: string = round.toString();
        let currentSeed: Buffer = Crypto.HashAlgorithms.sha256(seedSource);

        delegates = AppUtils.cloneDeep(delegates);
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
        const block: Interfaces.IBlockData = await this.connection.blocksRepository.findById(id);

        if (!block) {
            return undefined;
        }

        const transactions: Array<{
            serialized: Buffer;
            id: string;
        }> = await this.connection.transactionsRepository.findByBlockId(block.id);

        block.transactions = transactions.map(
            ({ serialized, id }) => Transactions.TransactionFactory.fromBytesUnsafe(serialized, id).data,
        );

        return Blocks.BlockFactory.fromData(block);
    }

    public async getBlocks(offset: number, limit: number, headersOnly?: boolean): Promise<Interfaces.IBlockData[]> {
        // The functions below return matches in the range [start, end], including both ends.
        const start: number = offset;
        const end: number = offset + limit - 1;

        let blocks: Interfaces.IBlockData[] = app
            .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
            .getLastBlocksByHeight(start, end, headersOnly);

        if (blocks.length !== limit) {
            blocks = (await this.connection.blocksRepository.heightRangeWithTransactions(start, end)).map(block => ({
                ...block,
                transactions:
                    headersOnly || !block.transactions
                        ? undefined
                        : block.transactions.map(
                              (transaction: string) =>
                                  Transactions.TransactionFactory.fromBytesUnsafe(Buffer.from(transaction, "hex")).data,
                          ),
            }));
        }

        return blocks;
    }

    public async getBlocksForDownload(
        offset: number,
        limit: number,
        headersOnly?: boolean,
    ): Promise<Contracts.Database.DownloadBlock[]> {
        if (headersOnly) {
            return (this.connection.blocksRepository.heightRange(offset, offset + limit - 1) as unknown) as Promise<
                Contracts.Database.DownloadBlock[]
            >;
        }

        return this.connection.blocksRepository.heightRangeWithTransactions(offset, offset + limit - 1);
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
        const blocks = [];

        // Map of height -> index in heights[], e.g. if
        // heights[5] == 6000000, then
        // toGetFromDB[6000000] == 5
        // In this map we only store a subset of the heights - the ones we could not retrieve
        // from app/state and need to get from the database.
        const toGetFromDB = {};

        for (const [i, height] of heights.entries()) {
            const stateBlocks = app
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
            const blocksByHeights = await this.connection.blocksRepository.findByHeights(heightsToGetFromDB);

            for (const blockFromDB of blocksByHeights) {
                const index = toGetFromDB[blockFromDB.height];
                blocks[index] = blockFromDB;
            }
        }

        return blocks;
    }

    public async getBlocksForRound(roundInfo?: Contracts.Shared.RoundInfo): Promise<Interfaces.IBlock[]> {
        let lastBlock: Interfaces.IBlock = app
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
                    return app.get<any>(Container.Identifiers.StateStore).getGenesisBlock();
                }

                return Blocks.BlockFactory.fromData(block);
            },
        );
    }

    public async getForgedTransactionsIds(ids: string[]): Promise<string[]> {
        if (!ids.length) {
            return [];
        }

        return (await this.connection.transactionsRepository.forged(ids)).map(
            (transaction: Interfaces.ITransactionData) => transaction.id,
        );
    }

    public async getLastBlock(): Promise<Interfaces.IBlock> {
        const block: Interfaces.IBlockData = await this.connection.blocksRepository.latest();

        if (!block) {
            return undefined;
        }

        const transactions: Array<{
            serialized: Buffer;
            id: string;
        }> = await this.connection.transactionsRepository.latestByBlock(block.id);

        block.transactions = transactions.map(
            ({ serialized, id }) => Transactions.TransactionFactory.fromBytesUnsafe(serialized, id).data,
        );

        return Blocks.BlockFactory.fromData(block);
    }

    public async getCommonBlocks(ids: string[]): Promise<Interfaces.IBlockData[]> {
        let commonBlocks: Interfaces.IBlockData[] = app
            .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
            .getCommonBlocks(ids);

        if (commonBlocks.length < ids.length) {
            commonBlocks = await this.connection.blocksRepository.common(ids);
        }

        return commonBlocks;
    }

    public async getRecentBlockIds(): Promise<string[]> {
        let blocks: any[] = app
            .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
            .getLastBlockIds()
            .reverse()
            .slice(0, 10);

        if (blocks.length < 10) {
            blocks = await this.connection.blocksRepository.recent(10);
        }

        return blocks.map(block => block.id);
    }

    public async getTopBlocks(count: number): Promise<Interfaces.IBlockData[]> {
        const blocks: Interfaces.IBlockData[] = await this.connection.blocksRepository.top(count);

        await this.loadTransactionsForBlocks(blocks);

        return blocks;
    }

    public async getTransaction(id: string) {
        return this.connection.transactionsRepository.findById(id);
    }

    public async loadBlocksFromCurrentRound(): Promise<void> {
        this.blocksInCurrentRound = await this.getBlocksForRound();
    }

    public async revertBlock(block: Interfaces.IBlock): Promise<void> {
        await this.revertRound(block.data.height);
        this.blockState.revertBlock(block);

        assert(this.blocksInCurrentRound.pop().data.id === block.data.id);

        for (let i = block.transactions.length - 1; i >= 0; i--) {
            this.emitter.dispatch(Enums.Events.State.TransactionReverted, block.transactions[i].data);
        }

        this.emitter.dispatch(Enums.Events.State.BlockReverted, block.data);
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

    public async saveBlock(block: Interfaces.IBlock): Promise<void> {
        await this.connection.saveBlock(block);
    }

    public async saveBlocks(blocks: Interfaces.IBlock[]): Promise<void> {
        await this.connection.saveBlocks(blocks);
    }

    public async saveRound(activeDelegates: Contracts.State.Wallet[]): Promise<void> {
        this.logger.info(`Saving round ${activeDelegates[0].getAttribute("delegate.round").toLocaleString()}`);

        await this.connection.roundsRepository.insert(activeDelegates);

        this.emitter.dispatch(Enums.Events.State.RoundCreated, activeDelegates);
    }

    public async verifyBlockchain(): Promise<boolean> {
        const errors: string[] = [];

        const lastBlock: Interfaces.IBlock = app.get<any>(Container.Identifiers.StateStore).getLastBlock();

        // Last block is available
        if (!lastBlock) {
            errors.push("Last block is not available");
        } else {
            const numberOfBlocks: number = await this.connection.blocksRepository.count();

            // Last block height equals the number of stored blocks
            if (lastBlock.data.height !== +numberOfBlocks) {
                errors.push(
                    `Last block height: ${lastBlock.data.height.toLocaleString()}, number of stored blocks: ${numberOfBlocks}`,
                );
            }
        }

        const blockStats: {
            numberOfTransactions: number;
            totalFee: Utils.BigNumber;
            totalAmount: Utils.BigNumber;
            count: number;
        } = await this.connection.blocksRepository.statistics();

        const transactionStats: {
            count: number;
            totalFee: Utils.BigNumber;
            totalAmount: Utils.BigNumber;
        } = await this.connection.transactionsRepository.statistics();

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

    public async verifyTransaction(transaction: Interfaces.ITransaction): Promise<boolean> {
        const senderId: string = Identities.Address.fromPublicKey(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByAddress(senderId);
        const transactionHandler: Handlers.TransactionHandler = await app
            .get<any>("transactionHandlerRegistry")
            .get(transaction.type, transaction.typeGroup);

        if (!sender.publicKey) {
            sender.publicKey = transaction.data.senderPublicKey;

            this.walletRepository.reindex(sender);
        }

        const dbTransaction = await this.getTransaction(transaction.data.id);

        try {
            await transactionHandler.throwIfCannotBeApplied(transaction, sender, this.walletRepository);
            return !dbTransaction;
        } catch {
            return false;
        }
    }

    private detectMissedBlocks(block: Interfaces.IBlock) {
        const lastBlock: Interfaces.IBlock = app.get<any>(Container.Identifiers.StateStore).getLastBlock();

        if (lastBlock.data.height === 1) {
            return;
        }

        const lastSlot: number = Crypto.Slots.getSlotNumber(lastBlock.data.timestamp);
        const currentSlot: number = Crypto.Slots.getSlotNumber(block.data.timestamp);

        const missedSlots: number = Math.min(currentSlot - lastSlot - 1, this.forgingDelegates.length);
        for (let i = 0; i < missedSlots; i++) {
            const missedSlot: number = lastSlot + i + 1;
            const delegate: Contracts.State.Wallet = this.forgingDelegates[missedSlot % this.forgingDelegates.length];

            this.logger.debug(
                `Delegate ${delegate.getAttribute("delegate.username")} (${delegate.publicKey}) just missed a block.`,
            );

            this.emitter.dispatch(Enums.Events.State.ForgerMissing, {
                delegate,
            });
        }
    }

    private async initializeLastBlock(): Promise<void> {
        let lastBlock: Interfaces.IBlock;
        let tries = 5;

        const getLastBlock = async (): Promise<Interfaces.IBlock> => {
            try {
                return await this.getLastBlock();
            } catch (error) {
                this.logger.error(error.message);

                if (tries > 0) {
                    const block: Interfaces.IBlockData = await this.connection.blocksRepository.latest();
                    await this.deleteBlocks([block]);
                    tries--;
                } else {
                    app.terminate("Unable to deserialize last block from database.", error);
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

        const ids: string[] = blocks.map((block: Interfaces.IBlockData) => block.id);
        return this.connection.transactionsRepository.latestByBlocks(ids);
    }

    private async createGenesisBlock(): Promise<Interfaces.IBlock> {
        const genesisBlock: Interfaces.IBlock = app
            .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
            .getGenesisBlock();

        await this.saveBlock(genesisBlock);

        return genesisBlock;
    }

    private configureState(lastBlock: Interfaces.IBlock): void {
        app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore).setLastBlock(lastBlock);

        const { blocktime, block } = Managers.configManager.getMilestone();

        const blocksPerDay: number = Math.ceil(86400 / blocktime);
        app.get<any>(Container.Identifiers.StateBlockStore).resize(blocksPerDay);
        app.get<any>(Container.Identifiers.StateTransactionStore).resize(blocksPerDay * block.maxTransactions);
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
                const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(delegate.publicKey);

                this.logger.debug(
                    `Delegate ${wallet.getAttribute("delegate.username")} (${wallet.publicKey}) just missed a round.`,
                );

                this.emitter.dispatch(Enums.Events.State.RoundMissed, {
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

        const tempWalletRepository = this.walletRepository.clone();

        const tempBlockState = app.resolve<BlockState>(BlockState).init(tempWalletRepository);
        const tempWalletState = app.resolve<Wallets.WalletState>(Wallets.WalletState).init(tempWalletRepository);

        // Revert all blocks in reverse order
        const index: number = blocks.length - 1;

        let height = 0;
        for (let i = index; i >= 0; i--) {
            height = blocks[i].data.height;

            if (height === 1) {
                break;
            }

            await tempBlockState.revertBlock(blocks[i]);
        }

        const delegates: Contracts.State.Wallet[] = tempWalletState.loadActiveDelegateList(roundInfo);

        for (const delegate of tempWalletRepository.allByUsername()) {
            const delegateWallet = this.walletRepository.findByUsername(delegate.getAttribute("delegate.username"));
            delegateWallet.setAttribute("delegate.rank", delegate.getAttribute("delegate.rank"));
        }

        return delegates;
    }

    private async emitTransactionEvents(transaction: Interfaces.ITransaction): Promise<void> {
        this.emitter.dispatch(Enums.Events.State.TransactionApplied, transaction.data);

        (await app.get<any>("transactionHandlerRegistry").get(transaction.type, transaction.typeGroup)).emitEvents(
            transaction,
            this.emitter,
        );
    }
}
