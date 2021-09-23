"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const crypto_1 = require("@arkecosystem/crypto");
const boom_1 = __importDefault(require("@hapi/boom"));
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const controller_1 = require("../shared/controller");
class NodeController extends controller_1.Controller {
    async status(request, h) {
        try {
            const lastBlock = this.blockchain.getLastBlock();
            const networkHeight = this.blockchain.p2p.getMonitor().getNetworkHeight();
            return {
                data: {
                    synced: this.blockchain.isSynced(),
                    now: lastBlock ? lastBlock.data.height : 0,
                    blocksCount: networkHeight - lastBlock.data.height || 0,
                    timestamp: crypto_1.Crypto.Slots.getTime(),
                },
            };
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async syncing(request, h) {
        try {
            const lastBlock = this.blockchain.getLastBlock();
            const networkHeight = this.blockchain.p2p.getMonitor().getNetworkHeight();
            return {
                data: {
                    syncing: !this.blockchain.isSynced(),
                    blocks: networkHeight - lastBlock.data.height || 0,
                    height: lastBlock.data.height,
                    id: lastBlock.data.id,
                },
            };
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async configuration(request, h) {
        try {
            const network = this.config.get("network");
            const dynamicFees = core_container_1.app.resolveOptions("transaction-pool").dynamicFees;
            return {
                data: {
                    core: {
                        version: core_container_1.app.getVersion(),
                    },
                    nethash: network.nethash,
                    slip44: network.slip44,
                    wif: network.wif,
                    token: network.client.token,
                    symbol: network.client.symbol,
                    explorer: network.client.explorer,
                    version: network.pubKeyHash,
                    ports: super.toResource(this.config, "ports"),
                    constants: this.config.getMilestone(this.blockchain.getLastHeight()),
                    transactionPool: {
                        dynamicFees: dynamicFees.enabled ? dynamicFees : { enabled: false },
                    },
                },
            };
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async configurationCrypto() {
        try {
            return {
                data: crypto_1.Managers.configManager.getPreset(this.config.get("network").name),
            };
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async fees(request) {
        const { transactionsBusinessRepository } = core_container_1.app.resolvePlugin("database");
        // @ts-ignore
        const results = await transactionsBusinessRepository.getFeeStatistics(request.query.days);
        const groupedByTypeGroup = {};
        for (const result of results) {
            if (!groupedByTypeGroup[result.typeGroup]) {
                groupedByTypeGroup[result.typeGroup] = {};
            }
            const handler = await core_transactions_1.Handlers.Registry.get(result.type, result.typeGroup);
            groupedByTypeGroup[result.typeGroup][handler.getConstructor().key] = {
                avg: result.avg,
                max: result.max,
                min: result.min,
                sum: result.sum,
            };
        }
        return { meta: { days: request.query.days }, data: groupedByTypeGroup };
    }
    async debug(request, h) {
        const logPath = process.env.CORE_PATH_LOG;
        const logFile = `${logPath}/${core_container_1.app.getName()}-current.log`;
        if (!fs_1.existsSync(logFile)) {
            return boom_1.default.notFound(logFile);
        }
        const log = child_process_1.spawnSync("tail", ["-n", `${request.query.lines}`, logFile]).output.toString();
        return h.response(log).type("text/plain");
    }
}
exports.NodeController = NodeController;
//# sourceMappingURL=controller.js.map