import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Crypto, Managers } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { Controller } from "../shared/controller";

export class NodeController extends Controller {
    public async status(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const lastBlock = this.blockchain.getLastBlock();
            const networkHeight = this.blockchain.p2p.getMonitor().getNetworkHeight();

            return {
                data: {
                    synced: this.blockchain.isSynced(),
                    now: lastBlock ? lastBlock.data.height : 0,
                    blocksCount: networkHeight - lastBlock.data.height || 0,
                    timestamp: Crypto.Slots.getTime(),
                },
            };
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async syncing(request: Hapi.Request, h: Hapi.ResponseToolkit) {
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
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async configuration(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const network = this.config.get("network");
            const dynamicFees = app.resolveOptions("transaction-pool").dynamicFees;

            return {
                data: {
                    core: {
                        version: app.getVersion(),
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
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async configurationCrypto() {
        try {
            return {
                data: Managers.configManager.getPreset(this.config.get("network").name),
            };
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async fees(request: Hapi.Request) {
        const { transactionsBusinessRepository } = app.resolvePlugin<Database.IDatabaseService>("database");

        // @ts-ignore
        const results = await transactionsBusinessRepository.getFeeStatistics(request.query.days);

        const groupedByTypeGroup = {};
        for (const result of results) {
            if (!groupedByTypeGroup[result.typeGroup]) {
                groupedByTypeGroup[result.typeGroup] = {};
            }

            const handler: Handlers.TransactionHandler = await Handlers.Registry.get(result.type, result.typeGroup);
            groupedByTypeGroup[result.typeGroup][handler.getConstructor().key] = {
                avg: result.avg,
                max: result.max,
                min: result.min,
                sum: result.sum,
            };
        }

        return { meta: { days: request.query.days }, data: groupedByTypeGroup };
    }

    public async debug(request: Hapi.Request, h) {
        const logPath: string = process.env.CORE_PATH_LOG;
        const logFile: string = `${logPath}/${app.getName()}-current.log`;

        if (!existsSync(logFile)) {
            return Boom.notFound(logFile);
        }

        const log: string = spawnSync("tail", ["-n", `${request.query.lines}`, logFile]).output.toString();

        return h.response(log).type("text/plain");
    }
}
