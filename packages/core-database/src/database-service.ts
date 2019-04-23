import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Blockchain, Database, EventEmitter, Logger, Shared } from "@arkecosystem/core-interfaces";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Bignum, configManager, crypto, HashAlgorithms, models, Transaction } from "@arkecosystem/crypto";
import assert from "assert";

const { Block } = models;

export class DatabaseService implements Database.IDatabaseService {
    public connection: Database.IConnection;
    public walletManager: Database.IWalletManager;
    public logger = app.resolvePlugin<Logger.ILogger>("logger");
    public emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
    public config = app.getConfig();
    public options: any;
    public wallets: Database.IWalletsBusinessRepository;
    public delegates: Database.IDelegatesBusinessRepository;
    public blocksBusinessRepository: Database.IBlocksBusinessRepository;
    public transactionsBusinessRepository: Database.ITransactionsBusinessRepository;
    public blocksInCurrentRound: models.Block[] = null;
    public stateStarted: boolean = false;
    public restoredDatabaseIntegrity: boolean = false;
    public forgingDelegates: Database.IDelegateWallet[] = null;
    public cache: Map<any, any> = new Map();

    constructor(
        options: any,
        connection: Database.IConnection,
        walletManager: Database.IWalletManager,
        walletsBusinessRepository: Database.IWalletsBusinessRepository,
        delegatesBusinessRepository: Database.IDelegatesBusinessRepository,
        transactionsBusinessRepository: Database.ITransactionsBusinessRepository,
        blocksBusinessRepository: Database.IBlocksBusinessRepository,
    ) {
        this.connection = connection;
        this.walletManager = walletManager;
        this.options = options;
        this.wallets = walletsBusinessRepository;
        this.delegates = delegatesBusinessRepository;
        this.blocksBusinessRepository = blocksBusinessRepository;
        this.transactionsBusinessRepository = transactionsBusinessRepository;

        this.registerListeners();
    }

    public async init(): Promise<void> {
        await this.loadBlocksFromCurrentRound();
    }

    public async restoreCurrentRound(height: number): Promise<void> {
        await this.initializeActiveDelegates(height);
        await this.applyRound(height);
    }

    public async reset(): Promise<void> {
        await this.connection.blocksRepository.truncate();
        await this.connection.roundsRepository.truncate();
        await this.connection.transactionsRepository.truncate();

        await this.saveBlock(new Block(configManager.get("genesisBlock")));
    }

    public async applyBlock(block: models.Block) {
        this.walletManager.applyBlock(block);

        if (this.blocksInCurrentRound) {
            this.blocksInCurrentRound.push(block);
        }

        await this.applyRound(block.data.height);
        block.transactions.forEach(tx => this.emitTransactionEvents(tx));
        this.emitter.emit("block.applied", block.data);
        return true;
    }

    public async applyRound(height: number) {
        const nextHeight = height === 1 ? 1 : height + 1;
        if (roundCalculator.isNewRound(nextHeight)) {
            const roundInfo = roundCalculator.calculateRound(nextHeight);
            const { round } = roundInfo;

            if (
                nextHeight === 1 ||
                !this.forgingDelegates ||
                this.forgingDelegates.length === 0 ||
                this.forgingDelegates[0].round !== round
            ) {
                this.logger.info(`Starting Round ${roundInfo.round.toLocaleString()}`);

                try {
                    if (nextHeight > 1) {
                        this.updateDelegateStats(this.forgingDelegates);
                    }

                    const delegates = this.walletManager.loadActiveDelegateList(roundInfo);
                    await this.saveRound(delegates);
                    await this.setForgingDelegatesOfRound(roundInfo, delegates);
                    this.blocksInCurrentRound.length = 0;

                    this.emitter.emit("round.applied");
                } catch (error) {
                    // trying to leave database state has it was
                    await this.deleteRound(round);
                    throw error;
                }
            } else {
                this.logger.warn(
                    // tslint:disable-next-line:max-line-length
                    `Round ${round.toLocaleString()} has already been applied. This should happen only if you are a forger.`,
                );
            }
        }
    }

    public async buildWallets(): Promise<boolean> {
        this.walletManager.reset();

        try {
            const result = await this.connection.buildWallets();
            return result;
        } catch (e) {
            this.logger.error(e.stack);
        }

        return false;
    }

    public async commitQueuedQueries() {
        await this.connection.commitQueuedQueries();
    }

    public async deleteBlock(block: models.Block) {
        await this.connection.deleteBlock(block);
    }

    public async deleteRound(round: number) {
        await this.connection.roundsRepository.delete(round);
    }

    public enqueueDeleteBlock(block: models.Block) {
        this.connection.enqueueDeleteBlock(block);
    }

    public enqueueDeleteRound(height: number) {
        this.connection.enqueueDeleteRound(height);
    }

    public async getActiveDelegates(
        roundInfo: Shared.IRoundInfo,
        delegates?: Database.IDelegateWallet[],
    ): Promise<Database.IDelegateWallet[]> {
        const { round } = roundInfo;
        if (this.forgingDelegates && this.forgingDelegates.length && this.forgingDelegates[0].round === round) {
            return this.forgingDelegates;
        }

        // When called during applyRound we already know the delegates, so we don't have to query the database.
        if (!delegates || delegates.length === 0) {
            delegates = ((await this.connection.roundsRepository.findById(
                round,
            )) as unknown) as Database.IDelegateWallet[];
        }

        const seedSource = round.toString();
        let currentSeed = HashAlgorithms.sha256(seedSource);

        for (let i = 0, delCount = delegates.length; i < delCount; i++) {
            for (let x = 0; x < 4 && i < delCount; i++, x++) {
                const newIndex = currentSeed[x] % delCount;
                const b = delegates[newIndex];
                delegates[newIndex] = delegates[i];
                delegates[i] = b;
            }
            currentSeed = HashAlgorithms.sha256(currentSeed);
        }

        const forgingDelegates = delegates.map(delegate => {
            delegate.round = +delegate.round;
            delegate.username = this.walletManager.findByPublicKey(delegate.publicKey).username;
            return delegate;
        });

        return forgingDelegates;
    }

    public async getBlock(id: string) {
        // TODO: caching the last 1000 blocks, in combination with `saveBlock` could help to optimise
        const block: models.IBlockData = await this.connection.blocksRepository.findById(id);

        if (!block) {
            return null;
        }

        const transactions = await this.connection.transactionsRepository.findByBlockId(block.id);

        block.transactions = transactions.map(({ serialized, id }) => Transaction.fromBytesUnsafe(serialized, id).data);

        return new Block(block);
    }

    public async getBlocks(offset: number, limit: number) {
        let blocks = [];

        // The functions below return matches in the range [start, end], including both ends.
        const start = offset;
        const end = offset + limit - 1;

        if (app.has("state")) {
            blocks = app.resolve("state").getLastBlocksByHeight(start, end);
        }

        if (blocks.length !== limit) {
            blocks = await this.connection.blocksRepository.heightRange(start, end);

            await this.loadTransactionsForBlocks(blocks);
        }

        return blocks;
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

        const hasState = app.has("state");

        for (const [i, height] of heights.entries()) {
            if (hasState) {
                const stateBlocks = app.resolve("state").getLastBlocksByHeight(height, height);
                if (Array.isArray(stateBlocks) && stateBlocks.length > 0) {
                    blocks[i] = stateBlocks[0];
                }
            }

            if (blocks[i] === undefined) {
                toGetFromDB[height] = i;
            }
        }

        const heightsToGetFromDB = Object.keys(toGetFromDB).map(height => +height);
        if (heightsToGetFromDB.length > 0) {
            const blocksByHeights = await this.connection.blocksRepository.findByHeights(heightsToGetFromDB);

            for (const blockFromDB of blocksByHeights) {
                const index = toGetFromDB[blockFromDB.height];
                blocks[index] = blockFromDB;
            }
        }

        return blocks;
    }

    public async getBlocksForRound(roundInfo?: Shared.IRoundInfo) {
        let lastBlock;
        if (app.has("state")) {
            lastBlock = app.resolve<Blockchain.IStateStorage>("state").getLastBlock();
        } else {
            lastBlock = await this.getLastBlock();
        }

        if (!lastBlock) {
            return [];
        }

        const height = +lastBlock.data.height;
        if (!roundInfo) {
            roundInfo = roundCalculator.calculateRound(height);
        }

        const { maxDelegates, roundHeight } = roundInfo;

        const blocks = await this.getBlocks(roundHeight, maxDelegates);
        return blocks.map(b => new Block(b));
    }

    public async getForgedTransactionsIds(ids: string[]) {
        if (!ids.length) {
            return [];
        }

        const txs = await this.connection.transactionsRepository.forged(ids);
        return txs.map(tx => tx.id);
    }

    public async getLastBlock() {
        const block = await this.connection.blocksRepository.latest();

        if (!block) {
            return null;
        }

        const transactions = await this.connection.transactionsRepository.latestByBlock(block.id);

        block.transactions = transactions.map(({ serialized, id }) => Transaction.fromBytesUnsafe(serialized, id).data);

        return new Block(block);
    }

    public async getCommonBlocks(ids: string[]): Promise<models.IBlockData[]> {
        const state = app.resolve("state");
        let commonBlocks = state.getCommonBlocks(ids);
        if (commonBlocks.length < ids.length) {
            commonBlocks = await this.connection.blocksRepository.common(ids);
        }

        return commonBlocks;
    }

    public async getRecentBlockIds() {
        const state = app.resolve("state");
        let blocks = state
            .getLastBlockIds()
            .reverse()
            .slice(0, 10);

        if (blocks.length < 10) {
            blocks = await this.connection.blocksRepository.recent(10);
            blocks = blocks.map(block => block.id);
        }

        return blocks;
    }

    public async getTopBlocks(count: any) {
        const blocks = await this.connection.blocksRepository.top(count);

        await this.loadTransactionsForBlocks(blocks);

        return blocks;
    }

    public async getTransaction(id: string) {
        return this.connection.transactionsRepository.findById(id);
    }

    public async loadBlocksFromCurrentRound() {
        this.blocksInCurrentRound = await this.getBlocksForRound();
    }

    public async loadTransactionsForBlocks(blocks) {
        if (!blocks.length) {
            return;
        }

        const ids = blocks.map(block => block.id);

        let transactions = await this.connection.transactionsRepository.latestByBlocks(ids);
        transactions = transactions.map(tx => {
            const { data } = Transaction.fromBytesUnsafe(tx.serialized, tx.id);
            data.blockId = tx.blockId;
            return data;
        });

        for (const block of blocks) {
            if (block.numberOfTransactions > 0) {
                block.transactions = transactions.filter(transaction => transaction.blockId === block.id);
            }
        }
    }

    public async revertBlock(block: models.Block) {
        await this.revertRound(block.data.height);
        await this.walletManager.revertBlock(block);

        assert(this.blocksInCurrentRound.pop().data.id === block.data.id);

        this.emitter.emit("block.reverted", block.data);
    }

    public async revertRound(height: number) {
        const roundInfo = roundCalculator.calculateRound(height);
        const { round, nextRound, maxDelegates } = roundInfo;

        if (nextRound === round + 1 && height >= maxDelegates) {
            this.logger.info(`Back to previous round: ${round.toLocaleString()}`);

            this.blocksInCurrentRound = await this.getBlocksForRound(roundInfo);

            const delegates = await this.calcPreviousActiveDelegates(roundInfo, this.blocksInCurrentRound);
            await this.setForgingDelegatesOfRound(roundInfo, delegates);

            await this.deleteRound(nextRound);
        }
    }

    public async saveBlock(block: models.Block) {
        await this.connection.saveBlock(block);
    }

    public async saveRound(activeDelegates: Database.IDelegateWallet[]) {
        this.logger.info(`Saving round ${activeDelegates[0].round.toLocaleString()}`);

        await this.connection.roundsRepository.insert(activeDelegates);

        this.emitter.emit("round.created", activeDelegates);
    }

    public updateDelegateStats(delegates: Database.IDelegateWallet[]): void {
        if (!delegates || !this.blocksInCurrentRound) {
            return;
        }

        if (this.blocksInCurrentRound.length === 1 && this.blocksInCurrentRound[0].data.height === 1) {
            return;
        }

        this.logger.debug("Updating delegate statistics");

        try {
            delegates.forEach(delegate => {
                const producedBlocks = this.blocksInCurrentRound.filter(
                    blockGenerator => blockGenerator.data.generatorPublicKey === delegate.publicKey,
                );
                const wallet = this.walletManager.findByPublicKey(delegate.publicKey);

                if (producedBlocks.length === 0) {
                    this.logger.debug(`Delegate ${wallet.username} (${wallet.publicKey}) just missed a block.`);
                    this.emitter.emit("forger.missing", {
                        delegate: wallet,
                    });
                }
            });
        } catch (error) {
            this.logger.error(error.stack);
        }
    }

    public async verifyBlockchain(): Promise<{ valid: boolean; errors: any[] }> {
        const errors = [];

        const lastBlock = await this.getLastBlock();

        // Last block is available
        if (!lastBlock) {
            errors.push("Last block is not available");
        } else {
            const numberOfBlocks = await this.connection.blocksRepository.count();

            // Last block height equals the number of stored blocks
            if (lastBlock.data.height !== +numberOfBlocks) {
                errors.push(
                    `Last block height: ${lastBlock.data.height.toLocaleString()}, number of stored blocks: ${numberOfBlocks}`,
                );
            }
        }

        const blockStats = await this.connection.blocksRepository.statistics();
        const transactionStats = await this.connection.transactionsRepository.statistics();

        // Number of stored transactions equals the sum of block.numberOfTransactions in the database
        if (blockStats.numberOfTransactions !== transactionStats.count) {
            errors.push(
                `Number of transactions: ${transactionStats.count}, number of transactions included in blocks: ${
                    blockStats.numberOfTransactions
                }`,
            );
        }

        // Sum of all tx fees equals the sum of block.totalFee
        if (blockStats.totalFee !== transactionStats.totalFee) {
            errors.push(
                `Total transaction fees: ${transactionStats.totalFee}, total of block.totalFee : ${
                    blockStats.totalFee
                }`,
            );
        }

        // Sum of all tx amount equals the sum of block.totalAmount
        if (blockStats.totalAmount !== transactionStats.totalAmount) {
            errors.push(
                `Total transaction amounts: ${transactionStats.totalAmount}, total of block.totalAmount : ${
                    blockStats.totalAmount
                }`,
            );
        }

        return {
            valid: !errors.length,
            errors,
        };
    }

    public async verifyTransaction(transaction: Transaction): Promise<boolean> {
        const senderId = crypto.getAddress(transaction.data.senderPublicKey, this.config.get("network.pubKeyHash"));

        const sender = this.walletManager.findByAddress(senderId); // should exist
        const transactionHandler = TransactionHandlerRegistry.get(transaction.type);

        if (!sender.publicKey) {
            sender.publicKey = transaction.data.senderPublicKey;
            this.walletManager.reindex(sender);
        }

        const dbTransaction = await this.getTransaction(transaction.data.id);

        try {
            return transactionHandler.canBeApplied(transaction, sender) && !dbTransaction;
        } catch {
            return false;
        }
    }

    private async initializeActiveDelegates(height: number): Promise<void> {
        this.forgingDelegates = null;

        const roundInfo = roundCalculator.calculateRound(height);
        const delegates = await this.calcPreviousActiveDelegates(roundInfo);
        await this.setForgingDelegatesOfRound(roundInfo, delegates);
    }

    private async setForgingDelegatesOfRound(
        roundInfo: Shared.IRoundInfo,
        delegates?: Database.IDelegateWallet[],
    ): Promise<void> {
        const activeDelegates = await this.getActiveDelegates(roundInfo, delegates);
        this.forgingDelegates = activeDelegates;
    }

    private async calcPreviousActiveDelegates(
        roundInfo: Shared.IRoundInfo,
        blocks?: models.Block[],
    ): Promise<Database.IDelegateWallet[]> {
        blocks = blocks || (await this.getBlocksForRound(roundInfo));

        const tempWalletManager = this.walletManager.cloneDelegateWallets();

        // Revert all blocks in reverse order
        const index = blocks.length - 1;
        let height = 0;
        for (let i = index; i >= 0; i--) {
            height = blocks[i].data.height;
            if (height === 1) {
                break;
            }

            tempWalletManager.revertBlock(blocks[i]);
        }

        // Now retrieve the active delegate list from the temporary wallet manager.
        return tempWalletManager.loadActiveDelegateList(roundInfo);
    }

    private emitTransactionEvents(transaction: Transaction): void {
        this.emitter.emit("transaction.applied", transaction.data);

        const handler = TransactionHandlerRegistry.get(transaction.type);
        handler.emitEvents(transaction, this.emitter);
    }

    private registerListeners(): void {
        this.emitter.on(ApplicationEvents.StateStarted, () => {
            this.stateStarted = true;
        });

        this.emitter.on(ApplicationEvents.WalletColdCreated, async coldWallet => {
            try {
                const wallet = await this.connection.walletsRepository.findByAddress(coldWallet.address);

                if (wallet) {
                    Object.keys(wallet).forEach(key => {
                        if (["balance"].indexOf(key) !== -1) {
                            return;
                        }

                        coldWallet[key] = key !== "voteBalance" ? wallet[key] : new Bignum(wallet[key]);
                    });
                }
            } catch (err) {
                this.logger.error(err);
            }
        });
    }
}
