"use strict";
// tslint:disable:max-classes-per-file
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
const validate_generator_1 = require("../utils/validate-generator");
const handlers_1 = require("./handlers");
var BlockProcessorResult;
(function (BlockProcessorResult) {
    BlockProcessorResult[BlockProcessorResult["Accepted"] = 0] = "Accepted";
    BlockProcessorResult[BlockProcessorResult["DiscardedButCanBeBroadcasted"] = 1] = "DiscardedButCanBeBroadcasted";
    BlockProcessorResult[BlockProcessorResult["Rejected"] = 2] = "Rejected";
    BlockProcessorResult[BlockProcessorResult["Rollback"] = 3] = "Rollback";
})(BlockProcessorResult = exports.BlockProcessorResult || (exports.BlockProcessorResult = {}));
class BlockProcessor {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.logger = core_container_1.app.resolvePlugin("logger");
    }
    async process(block) {
        return (await this.getHandler(block)).execute();
    }
    async getHandler(block) {
        if (crypto_1.Utils.isException({ ...block.data, transactions: block.transactions.map(tx => tx.data) })) {
            return new handlers_1.ExceptionHandler(this.blockchain, block);
        }
        if (!(await this.verifyBlock(block))) {
            return new handlers_1.VerificationFailedHandler(this.blockchain, block);
        }
        if (this.blockContainsIncompatibleTransactions(block)) {
            return new handlers_1.IncompatibleTransactionsHandler(this.blockchain, block);
        }
        if (this.blockContainsOutOfOrderNonce(block)) {
            return new handlers_1.NonceOutOfOrderHandler(this.blockchain, block);
        }
        const isValidGenerator = await validate_generator_1.validateGenerator(block);
        const isChained = core_utils_1.isBlockChained(this.blockchain.getLastBlock().data, block.data);
        if (!isChained) {
            return new handlers_1.UnchainedHandler(this.blockchain, block, isValidGenerator);
        }
        if (!isValidGenerator) {
            return new handlers_1.InvalidGeneratorHandler(this.blockchain, block);
        }
        const containsForgedTransactions = await this.checkBlockContainsForgedTransactions(block);
        if (containsForgedTransactions) {
            return new handlers_1.AlreadyForgedHandler(this.blockchain, block);
        }
        return new handlers_1.AcceptBlockHandler(this.blockchain, block);
    }
    async verifyBlock(block) {
        if (block.verification.containsMultiSignatures) {
            try {
                for (const transaction of block.transactions) {
                    const handler = await core_transactions_1.Handlers.Registry.get(transaction.type, transaction.typeGroup);
                    await handler.verify(transaction, this.blockchain.database.walletManager);
                }
                block.verification = block.verify();
            }
            catch (error) {
                this.logger.warn(`Failed to verify block, because: ${error.message}`);
                block.verification.verified = false;
            }
        }
        const { verified } = block.verification;
        if (!verified) {
            this.logger.warn(`Block ${block.data.height.toLocaleString()} (${block.data.id}) disregarded because verification failed`);
            this.logger.warn(JSON.stringify(block.verification, undefined, 4));
            return false;
        }
        return true;
    }
    async checkBlockContainsForgedTransactions(block) {
        if (block.transactions.length > 0) {
            const forgedIds = await this.blockchain.database.getForgedTransactionsIds(block.transactions.map(tx => tx.id));
            if (forgedIds.length > 0) {
                const { transactionPool } = this.blockchain;
                if (transactionPool) {
                    transactionPool.removeTransactionsById(forgedIds);
                }
                this.logger.warn(`Block ${block.data.height.toLocaleString()} disregarded, because it contains already forged transactions`);
                this.logger.debug(`${JSON.stringify(forgedIds, undefined, 4)}`);
                return true;
            }
        }
        return false;
    }
    /**
     * Check if a block contains incompatible transactions and should thus be rejected.
     */
    blockContainsIncompatibleTransactions(block) {
        for (let i = 1; i < block.transactions.length; i++) {
            if (block.transactions[i].data.version !== block.transactions[0].data.version) {
                return true;
            }
        }
        return false;
    }
    /**
     * For a given sender, v2 transactions must have strictly increasing nonce without gaps.
     */
    blockContainsOutOfOrderNonce(block) {
        const nonceBySender = {};
        for (const transaction of block.transactions) {
            const data = transaction.data;
            if (data.version < 2) {
                break;
            }
            const sender = data.senderPublicKey;
            if (nonceBySender[sender] === undefined) {
                nonceBySender[sender] = this.blockchain.database.walletManager.getNonce(sender);
            }
            if (!nonceBySender[sender].plus(1).isEqualTo(data.nonce)) {
                this.logger.warn(`Block { height: ${block.data.height.toLocaleString()}, id: ${block.data.id} } ` +
                    `not accepted: invalid nonce order for sender ${sender}: ` +
                    `preceding nonce: ${nonceBySender[sender].toFixed()}, ` +
                    `transaction ${data.id} has nonce ${data.nonce.toFixed()}.`);
                return true;
            }
            nonceBySender[sender] = data.nonce;
        }
        return false;
    }
}
exports.BlockProcessor = BlockProcessor;
//# sourceMappingURL=block-processor.js.map