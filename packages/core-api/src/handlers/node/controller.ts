import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { Managers } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import groupBy from "lodash.groupby";
import math from "mathjs";
import { Controller } from "../shared/controller";

export class NodeController extends Controller {
    public async status(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const lastBlock = this.blockchain.getLastBlock();
            const networkHeight = await this.blockchain.p2p.getMonitor().getNetworkHeight();

            return {
                data: {
                    synced: this.blockchain.isSynced(),
                    now: lastBlock ? lastBlock.data.height : 0,
                    blocksCount: networkHeight - lastBlock.data.height || 0,
                },
            };
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async syncing(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const lastBlock = this.blockchain.getLastBlock();
            const networkHeight = await this.blockchain.p2p.getMonitor().getNetworkHeight();

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
        try {
            const { transactionsBusinessRepository } = app.resolvePlugin<Database.IDatabaseService>("database");

            // @ts-ignore
            const results = await transactionsBusinessRepository.getFeeStatistics(request.query.days);

            const resultsByDays = [];
            for (const [type, transactions] of Object.entries(groupBy(results, "type"))) {
                const fees = transactions.map(transaction => math.bignumber(transaction.fee));

                resultsByDays.push({
                    type,
                    min: math.min(...fees).toFixed(0),
                    max: math.max(...fees).toFixed(0),
                    avg: math.mean(...fees).toFixed(0),
                    sum: math.sum(...fees).toFixed(0),
                    median: math.median(...fees).toFixed(0),
                });
            }

            return { meta: { days: request.query.days }, data: resultsByDays };
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
