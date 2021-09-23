"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
const ipaddr_js_1 = require("ipaddr.js");
exports.acceptNewPeer = async ({ service, req }) => {
    await service.getProcessor().validateAndAcceptPeer({ ip: req.data.ip });
};
exports.isPeerOrForger = ({ service, req }) => {
    const sanitizedIp = ipaddr_js_1.process(req.data.ip).toString();
    return {
        isPeerOrForger: service.getStorage().hasPeer(sanitizedIp) ||
            core_utils_1.isWhitelisted(core_container_1.app.resolveOptions("p2p").remoteAccess, sanitizedIp),
    };
};
exports.emitEvent = ({ req }) => {
    core_container_1.app.resolvePlugin("event-emitter").emit(req.data.event, req.data.body);
};
exports.getUnconfirmedTransactions = async () => {
    const blockchain = core_container_1.app.resolvePlugin("blockchain");
    const { maxTransactions } = core_container_1.app.getConfig().getMilestone(blockchain.getLastBlock().data.height).block;
    const transactionPool = core_container_1.app.resolvePlugin("transaction-pool");
    return {
        transactions: await transactionPool.getTransactionsForForging(maxTransactions),
        poolSize: await transactionPool.getPoolSize(),
    };
};
exports.getCurrentRound = async () => {
    const config = core_container_1.app.getConfig();
    const databaseService = core_container_1.app.resolvePlugin("database");
    const blockchain = core_container_1.app.resolvePlugin("blockchain");
    const lastBlock = blockchain.getLastBlock();
    const height = lastBlock.data.height + 1;
    const roundInfo = core_utils_1.roundCalculator.calculateRound(height);
    const { maxDelegates, round } = roundInfo;
    const blockTime = config.getMilestone(height).blocktime;
    const reward = config.getMilestone(height).reward;
    const delegates = await databaseService.getActiveDelegates(roundInfo);
    const timestamp = crypto_1.Crypto.Slots.getTime();
    const blockTimestamp = crypto_1.Crypto.Slots.getSlotNumber(timestamp) * blockTime;
    const currentForger = parseInt((timestamp / blockTime)) % maxDelegates;
    const nextForger = (parseInt((timestamp / blockTime)) + 1) % maxDelegates;
    return {
        current: round,
        reward,
        timestamp: blockTimestamp,
        delegates,
        currentForger: delegates[currentForger],
        nextForger: delegates[nextForger],
        lastBlock: lastBlock.data,
        canForge: parseInt((1 + lastBlock.data.timestamp / blockTime)) * blockTime < timestamp - 1,
    };
};
exports.getNetworkState = async ({ service }) => {
    return service.getMonitor().getNetworkState();
};
exports.getRateLimitStatus = async ({ service, req, }) => {
    return service.getMonitor().getRateLimitStatus(req.data.ip, req.data.endpoint);
};
exports.isBlockedByRateLimit = async ({ service, req, }) => {
    return {
        blocked: await service.getMonitor().isBlockedByRateLimit(req.data.ip),
    };
};
exports.syncBlockchain = () => {
    core_container_1.app.resolvePlugin("logger").debug("Blockchain sync check WAKEUP requested by forger");
    core_container_1.app.resolvePlugin("blockchain").forceWakeup();
};
exports.getRateLimitedEndpoints = ({ service }) => {
    return service.getMonitor().getRateLimitedEndpoints();
};
//# sourceMappingURL=internal.js.map