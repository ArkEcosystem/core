"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
const pluralize_1 = __importDefault(require("pluralize"));
const errors_1 = require("../../errors");
const utils_1 = require("../../utils");
const errors_2 = require("../errors");
const get_peer_config_1 = require("../utils/get-peer-config");
const map_addr_1 = require("../utils/map-addr");
exports.getPeers = ({ service }) => {
    return service
        .getStorage()
        .getPeers()
        .map(peer => peer.toBroadcast())
        .sort((a, b) => a.latency - b.latency);
};
exports.getCommonBlocks = async ({ req, }) => {
    const blockchain = core_container_1.app.resolvePlugin("blockchain");
    const commonBlocks = await blockchain.database.getCommonBlocks(req.data.ids);
    if (!commonBlocks.length) {
        throw new errors_1.MissingCommonBlockError();
    }
    return {
        common: commonBlocks[0],
        lastBlockHeight: blockchain.getLastBlock().data.height,
    };
};
exports.getStatus = async () => {
    const lastBlock = core_container_1.app.resolvePlugin("blockchain").getLastBlock();
    return {
        state: {
            height: lastBlock ? lastBlock.data.height : 0,
            forgingAllowed: crypto_1.Crypto.Slots.isForgingAllowed(),
            currentSlot: crypto_1.Crypto.Slots.getSlotNumber(),
            header: lastBlock ? lastBlock.getHeader() : {},
        },
        config: get_peer_config_1.getPeerConfig(),
    };
};
exports.postBlock = async ({ req }) => {
    const blockchain = core_container_1.app.resolvePlugin("blockchain");
    const blockHex = req.data.block.toString("hex");
    const deserializedHeader = crypto_1.Blocks.Deserializer.deserialize(blockHex, true);
    if (deserializedHeader.data.numberOfTransactions > core_container_1.app.getConfig().getMilestone().block.maxTransactions) {
        throw new errors_2.TooManyTransactionsError(deserializedHeader.data);
    }
    const deserialized = crypto_1.Blocks.Deserializer.deserialize(blockHex);
    const block = {
        ...deserialized.data,
        transactions: deserialized.transactions.map(tx => tx.data),
    };
    const fromForger = utils_1.isWhitelisted(core_container_1.app.resolveOptions("p2p").remoteAccess, req.headers.remoteAddress);
    if (!fromForger) {
        if (blockchain.pingBlock(block)) {
            return;
        }
        const lastDownloadedBlock = blockchain.getLastDownloadedBlock();
        if (!core_utils_1.isBlockChained(lastDownloadedBlock, block)) {
            throw new errors_2.UnchainedBlockError(lastDownloadedBlock.height, block.height);
        }
    }
    if (block.transactions.length > core_container_1.app.getConfig().getMilestone().block.maxTransactions) {
        throw new errors_2.TooManyTransactionsError(block);
    }
    core_container_1.app.resolvePlugin("logger").info(`Received new block at height ${block.height.toLocaleString()} with ${pluralize_1.default("transaction", block.numberOfTransactions, true)} from ${map_addr_1.mapAddr(req.headers.remoteAddress)}`);
    blockchain.handleIncomingBlock(block, fromForger);
};
exports.postTransactions = async ({ service, req }) => {
    const processor = core_container_1.app
        .resolvePlugin("transaction-pool")
        .makeProcessor();
    const result = await processor.validate(req.data.transactions);
    if (result.invalid.length > 0) {
        throw new errors_2.InvalidTransactionsError();
    }
    if (result.broadcast.length > 0) {
        service.getMonitor().broadcastTransactions(processor.getBroadcastTransactions());
    }
    return result.accept;
};
exports.getBlocks = async ({ req }) => {
    const database = core_container_1.app.resolvePlugin("database");
    const reqBlockHeight = +req.data.lastBlockHeight + 1;
    const reqBlockLimit = +req.data.blockLimit || 400;
    const reqHeadersOnly = !!req.data.headersOnly;
    const blocks = await database.getBlocksForDownload(reqBlockHeight, reqBlockLimit, reqHeadersOnly);
    core_container_1.app.resolvePlugin("logger").info(`${map_addr_1.mapAddr(req.headers.remoteAddress)} has downloaded ${pluralize_1.default("block", blocks.length, true)} from height ${reqBlockHeight.toLocaleString()}`);
    return blocks;
};
//# sourceMappingURL=peer.js.map