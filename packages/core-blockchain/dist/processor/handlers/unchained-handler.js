"use strict";
// tslint:disable:max-classes-per-file
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_utils_1 = require("@arkecosystem/core-utils");
const block_processor_1 = require("../block-processor");
const block_handler_1 = require("./block-handler");
var UnchainedBlockStatus;
(function (UnchainedBlockStatus) {
    UnchainedBlockStatus[UnchainedBlockStatus["NotReadyToAcceptNewHeight"] = 0] = "NotReadyToAcceptNewHeight";
    UnchainedBlockStatus[UnchainedBlockStatus["ExceededNotReadyToAcceptNewHeightMaxAttempts"] = 1] = "ExceededNotReadyToAcceptNewHeightMaxAttempts";
    UnchainedBlockStatus[UnchainedBlockStatus["AlreadyInBlockchain"] = 2] = "AlreadyInBlockchain";
    UnchainedBlockStatus[UnchainedBlockStatus["EqualToLastBlock"] = 3] = "EqualToLastBlock";
    UnchainedBlockStatus[UnchainedBlockStatus["GeneratorMismatch"] = 4] = "GeneratorMismatch";
    UnchainedBlockStatus[UnchainedBlockStatus["DoubleForging"] = 5] = "DoubleForging";
    UnchainedBlockStatus[UnchainedBlockStatus["InvalidTimestamp"] = 6] = "InvalidTimestamp";
})(UnchainedBlockStatus || (UnchainedBlockStatus = {}));
class BlockNotReadyCounter {
    constructor() {
        this.id = "";
        this.attempts = 0;
    }
    increment(block) {
        const { id } = block.data;
        let attemptsLeft = false;
        if (this.id !== id) {
            this.reset();
            this.id = id;
        }
        this.attempts += 1;
        attemptsLeft = this.attempts <= BlockNotReadyCounter.maxAttempts;
        if (!attemptsLeft) {
            this.reset();
        }
        return attemptsLeft;
    }
    reset() {
        this.attempts = 0;
        this.id = "";
    }
}
BlockNotReadyCounter.maxAttempts = 5;
class UnchainedHandler extends block_handler_1.BlockHandler {
    constructor(blockchain, block, isValidGenerator) {
        super(blockchain, block);
        this.blockchain = blockchain;
        this.block = block;
        this.isValidGenerator = isValidGenerator;
    }
    async execute() {
        super.execute();
        this.blockchain.clearQueue();
        const status = this.checkUnchainedBlock();
        switch (status) {
            case UnchainedBlockStatus.DoubleForging: {
                const roundInfo = core_utils_1.roundCalculator.calculateRound(this.block.data.height);
                const delegates = await core_container_1.app.resolvePlugin("database").getActiveDelegates(roundInfo);
                if (delegates.some(delegate => delegate.publicKey === this.block.data.generatorPublicKey)) {
                    return block_processor_1.BlockProcessorResult.Rollback;
                }
                return block_processor_1.BlockProcessorResult.Rejected;
            }
            case UnchainedBlockStatus.ExceededNotReadyToAcceptNewHeightMaxAttempts: {
                this.blockchain.state.numberOfBlocksToRollback = 5000; // TODO: find a better heuristic based on peer information
                return block_processor_1.BlockProcessorResult.Rollback;
            }
            case UnchainedBlockStatus.GeneratorMismatch:
            case UnchainedBlockStatus.InvalidTimestamp: {
                return block_processor_1.BlockProcessorResult.Rejected;
            }
            default: {
                return block_processor_1.BlockProcessorResult.DiscardedButCanBeBroadcasted;
            }
        }
    }
    checkUnchainedBlock() {
        const lastBlock = this.blockchain.getLastBlock();
        if (this.block.data.height > lastBlock.data.height + 1) {
            this.logger.debug(`Blockchain not ready to accept new block at height ${this.block.data.height.toLocaleString()}. Last block: ${lastBlock.data.height.toLocaleString()}`);
            // Also remove all remaining queued blocks. Since blocks are downloaded in batches,
            // it is very likely that all blocks will be disregarded at this point anyway.
            // NOTE: This isn't really elegant, but still better than spamming the log with
            //       useless `not ready to accept` messages.
            if (this.blockchain.queue.length() > 0) {
                this.logger.debug(`Discarded ${this.blockchain.queue.length()} chunks of downloaded blocks.`);
            }
            // If we consecutively fail to accept the same block, our chain is likely forked. In this
            // case `increment` returns false.
            if (UnchainedHandler.notReadyCounter.increment(this.block)) {
                return UnchainedBlockStatus.NotReadyToAcceptNewHeight;
            }
            this.logger.debug(`Blockchain is still not ready to accept block at height ${this.block.data.height.toLocaleString()} after ${BlockNotReadyCounter.maxAttempts} tries. Going to rollback. :warning:`);
            return UnchainedBlockStatus.ExceededNotReadyToAcceptNewHeightMaxAttempts;
        }
        else if (this.block.data.height < lastBlock.data.height) {
            this.logger.debug(`Block ${this.block.data.height.toLocaleString()} disregarded because already in blockchain`);
            return UnchainedBlockStatus.AlreadyInBlockchain;
        }
        else if (this.block.data.height === lastBlock.data.height && this.block.data.id === lastBlock.data.id) {
            this.logger.debug(`Block ${this.block.data.height.toLocaleString()} just received`);
            return UnchainedBlockStatus.EqualToLastBlock;
        }
        else if (this.block.data.timestamp < lastBlock.data.timestamp) {
            this.logger.debug(`Block ${this.block.data.height.toLocaleString()} disregarded, because the timestamp is lower than the previous timestamp.`);
            return UnchainedBlockStatus.InvalidTimestamp;
        }
        else {
            if (this.isValidGenerator) {
                this.logger.warn(`Detect double forging by ${this.block.data.generatorPublicKey}`);
                return UnchainedBlockStatus.DoubleForging;
            }
            this.logger.info(`Forked block disregarded because it is not allowed to be forged. Caused by delegate: ${this.block.data.generatorPublicKey}`);
            return UnchainedBlockStatus.GeneratorMismatch;
        }
    }
}
exports.UnchainedHandler = UnchainedHandler;
UnchainedHandler.notReadyCounter = new BlockNotReadyCounter();
//# sourceMappingURL=unchained-handler.js.map