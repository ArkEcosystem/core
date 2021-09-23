"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const core_state_1 = require("@arkecosystem/core-state");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
const assert_1 = __importDefault(require("assert"));
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
class DatabaseService {
    constructor(options, connection, walletManager, walletsBusinessRepository, transactionsBusinessRepository, blocksBusinessRepository) {
        this.logger = core_container_1.app.resolvePlugin("logger");
        this.emitter = core_container_1.app.resolvePlugin("event-emitter");
        this.config = core_container_1.app.getConfig();
        this.blocksInCurrentRound = undefined;
        this.restoredDatabaseIntegrity = false;
        this.forgingDelegates = undefined;
        this.cache = new Map();
        this.connection = connection;
        this.walletManager = walletManager;
        this.options = options;
        this.wallets = walletsBusinessRepository;
        this.blocksBusinessRepository = blocksBusinessRepository;
        this.transactionsBusinessRepository = transactionsBusinessRepository;
    }
    async init() {
        if (process.env.CORE_ENV === "test") {
            crypto_1.Managers.configManager.getMilestone().aip11 = false;
            crypto_1.Managers.configManager.getMilestone().htlcEnabled = false;
        }
        this.emitter.emit(core_event_emitter_1.ApplicationEvents.StateStarting, this);
        core_container_1.app.resolvePlugin("state")
            .getStore()
            .setGenesisBlock(crypto_1.Blocks.BlockFactory.fromJson(crypto_1.Managers.configManager.get("genesisBlock")));
        if (process.env.CORE_RESET_DATABASE) {
            await this.reset();
        }
        await this.initializeLastBlock();
        try {
            await this.loadBlocksFromCurrentRound();
        }
        catch (error) {
            this.logger.warn(`Failed to load blocks from current round: ${error.message}`);
        }
    }
    async restoreCurrentRound(height) {
        await this.initializeActiveDelegates(height);
        await this.applyRound(height);
    }
    async reset() {
        await this.connection.resetAll();
        await this.createGenesisBlock();
    }
    async applyBlock(block) {
        await this.walletManager.applyBlock(block);
        if (this.blocksInCurrentRound) {
            this.blocksInCurrentRound.push(block);
        }
        this.detectMissedBlocks(block);
        await this.applyRound(block.data.height);
        for (const transaction of block.transactions) {
            await this.emitTransactionEvents(transaction);
        }
        this.emitter.emit(core_event_emitter_1.ApplicationEvents.BlockApplied, block.data);
    }
    async applyRound(height) {
        const nextHeight = height === 1 ? 1 : height + 1;
        if (core_utils_1.roundCalculator.isNewRound(nextHeight)) {
            const roundInfo = core_utils_1.roundCalculator.calculateRound(nextHeight);
            const { round } = roundInfo;
            if (nextHeight === 1 ||
                !this.forgingDelegates ||
                this.forgingDelegates.length === 0 ||
                this.forgingDelegates[0].getAttribute("delegate.round") !== round) {
                this.logger.info(`Starting Round ${roundInfo.round.toLocaleString()}`);
                try {
                    if (nextHeight > 1) {
                        this.detectMissedRound(this.forgingDelegates);
                    }
                    const delegates = this.walletManager.loadActiveDelegateList(roundInfo);
                    await this.setForgingDelegatesOfRound(roundInfo, delegates);
                    await this.saveRound(delegates);
                    this.blocksInCurrentRound = [];
                    this.emitter.emit(core_event_emitter_1.ApplicationEvents.RoundApplied);
                }
                catch (error) {
                    // trying to leave database state has it was
                    await this.deleteRound(round);
                    throw error;
                }
            }
            else {
                this.logger.warn(
                // tslint:disable-next-line:max-line-length
                `Round ${round.toLocaleString()} has already been applied. This should happen only if you are a forger.`);
            }
        }
    }
    async buildWallets() {
        this.walletManager.reset();
        await this.connection.buildWallets();
    }
    async deleteBlocks(blocks) {
        await this.connection.deleteBlocks(blocks);
    }
    async deleteRound(round) {
        await this.connection.roundsRepository.delete(round);
    }
    async getActiveDelegates(roundInfo, delegates) {
        if (!roundInfo) {
            const database = core_container_1.app.resolvePlugin("database");
            const lastBlock = await database.getLastBlock();
            roundInfo = core_utils_1.roundCalculator.calculateRound(lastBlock.data.height);
        }
        const { round } = roundInfo;
        if (this.forgingDelegates &&
            this.forgingDelegates.length &&
            this.forgingDelegates[0].getAttribute("delegate.round") === round) {
            return this.forgingDelegates;
        }
        // When called during applyRound we already know the delegates, so we don't have to query the database.
        if (!delegates || delegates.length === 0) {
            delegates = (await this.connection.roundsRepository.findById(round)).map(({ round, publicKey, balance }) => Object.assign(new core_state_1.Wallets.Wallet(crypto_1.Identities.Address.fromPublicKey(publicKey)), {
                publicKey,
                attributes: {
                    delegate: {
                        voteBalance: crypto_1.Utils.BigNumber.make(balance),
                        username: this.walletManager.findByPublicKey(publicKey).getAttribute("delegate.username"),
                    },
                },
            }));
        }
        for (const delegate of delegates) {
            delegate.setAttribute("delegate.round", round);
        }
        const seedSource = round.toString();
        let currentSeed = crypto_1.Crypto.HashAlgorithms.sha256(seedSource);
        delegates = lodash_clonedeep_1.default(delegates);
        for (let i = 0, delCount = delegates.length; i < delCount; i++) {
            for (let x = 0; x < 4 && i < delCount; i++, x++) {
                const newIndex = currentSeed[x] % delCount;
                const b = delegates[newIndex];
                delegates[newIndex] = delegates[i];
                delegates[i] = b;
            }
            currentSeed = crypto_1.Crypto.HashAlgorithms.sha256(currentSeed);
        }
        return delegates;
    }
    async getBlock(id) {
        // TODO: caching the last 1000 blocks, in combination with `saveBlock` could help to optimise
        const block = await this.connection.blocksRepository.findById(id);
        if (!block) {
            return undefined;
        }
        const transactions = await this.connection.transactionsRepository.findByBlockId(block.id);
        block.transactions = transactions.map(({ serialized, id }) => crypto_1.Transactions.TransactionFactory.fromBytesUnsafe(serialized, id).data);
        return crypto_1.Blocks.BlockFactory.fromData(block);
    }
    async getBlocks(offset, limit, headersOnly) {
        // The functions below return matches in the range [start, end], including both ends.
        const start = offset;
        const end = offset + limit - 1;
        let blocks = core_container_1.app
            .resolvePlugin("state")
            .getStore()
            .getLastBlocksByHeight(start, end, headersOnly);
        if (blocks.length !== limit) {
            blocks = (await this.connection.blocksRepository.heightRangeWithTransactions(start, end)).map(block => ({
                ...block,
                transactions: headersOnly || !block.transactions
                    ? undefined
                    : block.transactions.map((transaction) => crypto_1.Transactions.TransactionFactory.fromBytesUnsafe(Buffer.from(transaction, "hex")).data),
            }));
        }
        return blocks;
    }
    async getBlocksForDownload(offset, limit, headersOnly) {
        if (headersOnly) {
            return this.connection.blocksRepository.heightRange(offset, offset + limit - 1);
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
    async getBlocksByHeight(heights) {
        const blocks = [];
        // Map of height -> index in heights[], e.g. if
        // heights[5] == 6000000, then
        // toGetFromDB[6000000] == 5
        // In this map we only store a subset of the heights - the ones we could not retrieve
        // from app/state and need to get from the database.
        const toGetFromDB = {};
        for (const [i, height] of heights.entries()) {
            const stateBlocks = core_container_1.app
                .resolvePlugin("state")
                .getStore()
                .getLastBlocksByHeight(height, height, true);
            if (Array.isArray(stateBlocks) && stateBlocks.length > 0) {
                blocks[i] = stateBlocks[0];
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
    async getBlocksForRound(roundInfo) {
        let lastBlock = core_container_1.app
            .resolvePlugin("state")
            .getStore()
            .getLastBlock();
        if (!lastBlock) {
            lastBlock = await this.getLastBlock();
        }
        if (!lastBlock) {
            return [];
        }
        else if (lastBlock.data.height === 1) {
            return [lastBlock];
        }
        if (!roundInfo) {
            roundInfo = core_utils_1.roundCalculator.calculateRound(lastBlock.data.height);
        }
        return (await this.getBlocks(roundInfo.roundHeight, roundInfo.maxDelegates)).map((block) => {
            if (block.height === 1) {
                return core_container_1.app
                    .resolvePlugin("state")
                    .getStore()
                    .getGenesisBlock();
            }
            return crypto_1.Blocks.BlockFactory.fromData(block, { deserializeTransactionsUnchecked: true });
        });
    }
    async getForgedTransactionsIds(ids) {
        if (!ids.length) {
            return [];
        }
        return (await this.connection.transactionsRepository.forged(ids)).map((transaction) => transaction.id);
    }
    async getLastBlock() {
        const block = await this.connection.blocksRepository.latest();
        if (!block) {
            return undefined;
        }
        const transactions = await this.connection.transactionsRepository.latestByBlock(block.id);
        block.transactions = transactions.map(({ serialized, id }) => crypto_1.Transactions.TransactionFactory.fromBytesUnsafe(serialized, id).data);
        const lastBlock = crypto_1.Blocks.BlockFactory.fromData(block);
        if (block.height === 1 && process.env.CORE_ENV === "test") {
            crypto_1.Managers.configManager.getMilestone().aip11 = true;
            crypto_1.Managers.configManager.getMilestone().htlcEnabled = true;
        }
        return lastBlock;
    }
    async getCommonBlocks(ids) {
        let commonBlocks = core_container_1.app
            .resolvePlugin("state")
            .getStore()
            .getCommonBlocks(ids);
        if (commonBlocks.length < ids.length) {
            commonBlocks = await this.connection.blocksRepository.common(ids);
        }
        return commonBlocks;
    }
    async getRecentBlockIds() {
        let blocks = core_container_1.app
            .resolvePlugin("state")
            .getStore()
            .getLastBlockIds()
            .reverse()
            .slice(0, 10);
        if (blocks.length < 10) {
            blocks = await this.connection.blocksRepository.recent(10);
        }
        return blocks.map(block => block.id);
    }
    async getTopBlocks(count) {
        const blocks = await this.connection.blocksRepository.top(count);
        await this.loadTransactionsForBlocks(blocks);
        return blocks;
    }
    async getTransaction(id) {
        return this.connection.transactionsRepository.findById(id);
    }
    async loadBlocksFromCurrentRound() {
        this.blocksInCurrentRound = await this.getBlocksForRound();
    }
    async revertBlock(block) {
        await this.revertRound(block.data.height);
        await this.walletManager.revertBlock(block);
        assert_1.default(this.blocksInCurrentRound.pop().data.id === block.data.id);
        for (let i = block.transactions.length - 1; i >= 0; i--) {
            this.emitter.emit(core_event_emitter_1.ApplicationEvents.TransactionReverted, block.transactions[i].data);
        }
        this.emitter.emit(core_event_emitter_1.ApplicationEvents.BlockReverted, block.data);
    }
    async revertRound(height) {
        const roundInfo = core_utils_1.roundCalculator.calculateRound(height);
        const { round, nextRound, maxDelegates } = roundInfo;
        if (nextRound === round + 1 && height >= maxDelegates) {
            this.logger.info(`Back to previous round: ${round.toLocaleString()}`);
            this.blocksInCurrentRound = await this.getBlocksForRound(roundInfo);
            await this.setForgingDelegatesOfRound(roundInfo, await this.calcPreviousActiveDelegates(roundInfo, this.blocksInCurrentRound));
            await this.deleteRound(nextRound);
        }
    }
    async saveBlock(block) {
        await this.connection.saveBlock(block);
    }
    async saveBlocks(blocks) {
        await this.connection.saveBlocks(blocks);
    }
    async saveRound(activeDelegates) {
        this.logger.info(`Saving round ${activeDelegates[0].getAttribute("delegate.round").toLocaleString()}`);
        await this.connection.roundsRepository.insert(activeDelegates);
        this.emitter.emit(core_event_emitter_1.ApplicationEvents.RoundCreated, activeDelegates);
    }
    async verifyBlockchain() {
        const errors = [];
        const lastBlock = core_container_1.app
            .resolvePlugin("state")
            .getStore()
            .getLastBlock();
        // Last block is available
        if (!lastBlock) {
            errors.push("Last block is not available");
        }
        else {
            const numberOfBlocks = await this.connection.blocksRepository.count();
            // Last block height equals the number of stored blocks
            if (lastBlock.data.height !== +numberOfBlocks) {
                errors.push(`Last block height: ${lastBlock.data.height.toLocaleString()}, number of stored blocks: ${numberOfBlocks}`);
            }
        }
        const blockStats = await this.connection.blocksRepository.statistics();
        const transactionStats = await this.connection.transactionsRepository.statistics();
        // Number of stored transactions equals the sum of block.numberOfTransactions in the database
        if (blockStats.numberOfTransactions !== transactionStats.count) {
            errors.push(`Number of transactions: ${transactionStats.count}, number of transactions included in blocks: ${blockStats.numberOfTransactions}`);
        }
        // Sum of all tx fees equals the sum of block.totalFee
        if (blockStats.totalFee !== transactionStats.totalFee) {
            errors.push(`Total transaction fees: ${transactionStats.totalFee}, total of block.totalFee : ${blockStats.totalFee}`);
        }
        // Sum of all tx amount equals the sum of block.totalAmount
        if (blockStats.totalAmount !== transactionStats.totalAmount) {
            errors.push(`Total transaction amounts: ${transactionStats.totalAmount}, total of block.totalAmount : ${blockStats.totalAmount}`);
        }
        const hasErrors = errors.length > 0;
        if (hasErrors) {
            this.logger.error("FATAL: The database is corrupted");
            this.logger.error(JSON.stringify(errors, undefined, 4));
        }
        return !hasErrors;
    }
    async verifyTransaction(transaction) {
        const senderId = crypto_1.Identities.Address.fromPublicKey(transaction.data.senderPublicKey);
        const sender = this.walletManager.findByAddress(senderId);
        const transactionHandler = await core_transactions_1.Handlers.Registry.get(transaction.type, transaction.typeGroup);
        if (!sender.publicKey) {
            sender.publicKey = transaction.data.senderPublicKey;
            this.walletManager.reindex(sender);
        }
        const dbTransaction = await this.getTransaction(transaction.data.id);
        try {
            await transactionHandler.throwIfCannotBeApplied(transaction, sender, this.walletManager);
            return !dbTransaction;
        }
        catch (_a) {
            return false;
        }
    }
    detectMissedBlocks(block) {
        const lastBlock = core_container_1.app
            .resolvePlugin("state")
            .getStore()
            .getLastBlock();
        if (lastBlock.data.height === 1) {
            return;
        }
        const lastSlot = crypto_1.Crypto.Slots.getSlotNumber(lastBlock.data.timestamp);
        const currentSlot = crypto_1.Crypto.Slots.getSlotNumber(block.data.timestamp);
        const missedSlots = Math.min(currentSlot - lastSlot - 1, this.forgingDelegates.length);
        for (let i = 0; i < missedSlots; i++) {
            const missedSlot = lastSlot + i + 1;
            const delegate = this.forgingDelegates[missedSlot % this.forgingDelegates.length];
            this.logger.debug(`Delegate ${delegate.getAttribute("delegate.username")} (${delegate.publicKey}) just missed a block.`);
            this.emitter.emit(core_event_emitter_1.ApplicationEvents.ForgerMissing, {
                delegate,
            });
        }
    }
    async initializeLastBlock() {
        let lastBlock;
        let tries = 5;
        // Ensure the config manager is initialized, before attempting to call `fromData`
        // which otherwise uses potentially wrong milestones.
        let lastHeight = 1;
        const latest = await this.connection.blocksRepository.latest();
        if (latest) {
            lastHeight = latest.height;
        }
        crypto_1.Managers.configManager.setHeight(lastHeight);
        const getLastBlock = async () => {
            try {
                return await this.getLastBlock();
            }
            catch (error) {
                this.logger.error(error.message);
                if (tries > 0) {
                    const block = await this.connection.blocksRepository.latest();
                    await this.deleteBlocks([block]);
                    tries--;
                }
                else {
                    core_container_1.app.forceExit("Unable to deserialize last block from database.", error);
                    return undefined;
                }
                return getLastBlock();
            }
        };
        lastBlock = await getLastBlock();
        if (!lastBlock) {
            this.logger.warn("No block found in database");
            lastBlock = await this.createGenesisBlock();
        }
        if (process.env.CORE_ENV === "test") {
            crypto_1.Managers.configManager.getMilestone().aip11 = true;
            crypto_1.Managers.configManager.getMilestone().htlcEnabled = true;
        }
        this.configureState(lastBlock);
    }
    async loadTransactionsForBlocks(blocks) {
        const dbTransactions = await this.getTransactionsForBlocks(blocks);
        const transactions = dbTransactions.map(tx => {
            const { data } = crypto_1.Transactions.TransactionFactory.fromBytesUnsafe(tx.serialized, tx.id);
            data.blockId = tx.blockId;
            return data;
        });
        for (const block of blocks) {
            if (block.numberOfTransactions > 0) {
                block.transactions = transactions.filter(transaction => transaction.blockId === block.id);
            }
        }
    }
    async getTransactionsForBlocks(blocks) {
        if (!blocks.length) {
            return [];
        }
        const ids = blocks.map((block) => block.id);
        return this.connection.transactionsRepository.latestByBlocks(ids);
    }
    async createGenesisBlock() {
        const genesisBlock = core_container_1.app
            .resolvePlugin("state")
            .getStore()
            .getGenesisBlock();
        await this.saveBlock(genesisBlock);
        return genesisBlock;
    }
    configureState(lastBlock) {
        const state = core_container_1.app.resolvePlugin("state");
        state.getStore().setLastBlock(lastBlock);
        const { blocktime, block } = crypto_1.Managers.configManager.getMilestone();
        const blocksPerDay = Math.ceil(86400 / blocktime);
        state.getBlocks().resize(blocksPerDay);
        state.getTransactions().resize(blocksPerDay * block.maxTransactions);
    }
    detectMissedRound(delegates) {
        if (!delegates || !this.blocksInCurrentRound) {
            return;
        }
        if (this.blocksInCurrentRound.length === 1 && this.blocksInCurrentRound[0].data.height === 1) {
            return;
        }
        for (const delegate of delegates) {
            const producedBlocks = this.blocksInCurrentRound.filter(blockGenerator => blockGenerator.data.generatorPublicKey === delegate.publicKey);
            if (producedBlocks.length === 0) {
                const wallet = this.walletManager.findByPublicKey(delegate.publicKey);
                this.logger.debug(`Delegate ${wallet.getAttribute("delegate.username")} (${wallet.publicKey}) just missed a round.`);
                this.emitter.emit(core_event_emitter_1.ApplicationEvents.RoundMissed, {
                    delegate: wallet,
                });
            }
        }
    }
    async initializeActiveDelegates(height) {
        this.forgingDelegates = undefined;
        const roundInfo = core_utils_1.roundCalculator.calculateRound(height);
        await this.setForgingDelegatesOfRound(roundInfo, await this.calcPreviousActiveDelegates(roundInfo));
    }
    async setForgingDelegatesOfRound(roundInfo, delegates) {
        this.forgingDelegates = await this.getActiveDelegates(roundInfo, delegates);
    }
    async calcPreviousActiveDelegates(roundInfo, blocks) {
        blocks = blocks || (await this.getBlocksForRound(roundInfo));
        const tempWalletManager = this.walletManager.clone();
        // Revert all blocks in reverse order
        const index = blocks.length - 1;
        let height = 0;
        for (let i = index; i >= 0; i--) {
            height = blocks[i].data.height;
            if (height === 1) {
                break;
            }
            await tempWalletManager.revertBlock(blocks[i]);
        }
        const delegates = tempWalletManager.loadActiveDelegateList(roundInfo);
        for (const delegate of tempWalletManager.allByUsername()) {
            const delegateWallet = this.walletManager.findByUsername(delegate.getAttribute("delegate.username"));
            delegateWallet.setAttribute("delegate.rank", delegate.getAttribute("delegate.rank"));
        }
        return delegates;
    }
    async emitTransactionEvents(transaction) {
        this.emitter.emit(core_event_emitter_1.ApplicationEvents.TransactionApplied, transaction.data);
        (await core_transactions_1.Handlers.Registry.get(transaction.type, transaction.typeGroup)).emitEvents(transaction, this.emitter);
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=database-service.js.map