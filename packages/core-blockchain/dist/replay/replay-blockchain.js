"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_state_1 = require("@arkecosystem/core-state");
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
const blockchain_1 = require("../blockchain");
const errors_1 = require("./errors");
const memory_database_service_1 = require("./memory-database-service");
class ReplayBlockchain extends blockchain_1.Blockchain {
    constructor() {
        super({});
        this.chunkSize = 20000;
        this.walletManager = new core_state_1.Wallets.WalletManager();
        this.memoryDatabase = new memory_database_service_1.MemoryDatabaseService(this.walletManager);
        this.logger = core_container_1.app.resolvePlugin("logger");
        this.localDatabase = core_container_1.app.resolvePlugin("database");
        this.localDatabase.walletManager = this.walletManager;
        this.queue.kill();
        // @ts-ignore
        this.queue.drain(() => undefined);
    }
    get database() {
        return this.memoryDatabase;
    }
    get p2p() {
        return undefined;
    }
    get transactionPool() {
        return undefined;
    }
    resetLastDownloadedBlock() {
        return;
    }
    resetWakeUp() {
        return;
    }
    async replay(targetHeight = -1) {
        this.logger.info("Starting replay...");
        const lastBlock = await this.localDatabase.getLastBlock();
        const startHeight = 2;
        if (targetHeight <= startHeight || targetHeight > lastBlock.data.height) {
            targetHeight = lastBlock.data.height;
        }
        this.targetHeight = targetHeight;
        await this.processGenesisBlock();
        const replayBatch = async (batch, lastAcceptedHeight = 1) => {
            if (lastAcceptedHeight === targetHeight) {
                this.logger.info("Successfully finished replay to target height.");
                return this.disconnect();
            }
            const blocks = await this.fetchBatch(startHeight, batch, lastAcceptedHeight);
            const acceptedBlocks = await this.processBlocks(blocks);
            if (acceptedBlocks.length !== blocks.length) {
                throw new errors_1.FailedToReplayBlocksError();
            }
            await replayBatch(batch + 1, acceptedBlocks[acceptedBlocks.length - 1].data.height);
        };
        await replayBatch(1);
    }
    async fetchBatch(startHeight, batch, lastAcceptedHeight) {
        this.logger.info("Fetching blocks from database...");
        const offset = startHeight + (batch - 1) * this.chunkSize;
        const count = Math.min(this.targetHeight - lastAcceptedHeight, this.chunkSize);
        const blocks = await this.localDatabase.getBlocks(offset, count);
        return blocks;
    }
    async processGenesisBlock() {
        crypto_1.Managers.configManager.setHeight(1);
        const genesisBlock = crypto_1.Blocks.BlockFactory.fromJson(crypto_1.Managers.configManager.get("genesisBlock"));
        const { transactions } = genesisBlock;
        for (const transaction of transactions) {
            if (transaction.type === crypto_1.Enums.TransactionType.Transfer &&
                transaction.typeGroup === crypto_1.Enums.TransactionTypeGroup.Core) {
                const recipient = this.walletManager.findByAddress(transaction.data.recipientId);
                recipient.balance = new crypto_1.Utils.BigNumber(transaction.data.amount);
            }
        }
        for (const transaction of transactions) {
            const sender = this.walletManager.findByPublicKey(transaction.data.senderPublicKey);
            sender.balance = sender.balance.minus(transaction.data.amount).minus(transaction.data.fee);
            if (transaction.typeGroup === crypto_1.Enums.TransactionTypeGroup.Core) {
                if (transaction.type === crypto_1.Enums.TransactionType.DelegateRegistration) {
                    sender.setAttribute("delegate", {
                        username: transaction.data.asset.delegate.username,
                        voteBalance: crypto_1.Utils.BigNumber.ZERO,
                        forgedFees: crypto_1.Utils.BigNumber.ZERO,
                        forgedRewards: crypto_1.Utils.BigNumber.ZERO,
                        producedBlocks: 0,
                        round: 0,
                    });
                    this.walletManager.reindex(sender);
                }
                else if (transaction.type === crypto_1.Enums.TransactionType.Vote) {
                    const vote = transaction.data.asset.votes[0];
                    sender.setAttribute("vote", vote.slice(1));
                }
            }
        }
        this.walletManager.buildVoteBalances();
        this.state.setLastBlock(genesisBlock);
        const roundInfo = core_utils_1.roundCalculator.calculateRound(1);
        const delegates = this.walletManager.loadActiveDelegateList(roundInfo);
        this.localDatabase.forgingDelegates = await this.localDatabase.getActiveDelegates(roundInfo, delegates);
        this.memoryDatabase.restoreCurrentRound(1);
        this.logger.info("Finished loading genesis block.");
    }
    async disconnect() {
        await this.localDatabase.connection.disconnect();
    }
}
exports.ReplayBlockchain = ReplayBlockchain;
//# sourceMappingURL=replay-blockchain.js.map