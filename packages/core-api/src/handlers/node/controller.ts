import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { Crypto, Managers } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";

export class NodeController extends Controller {
    public async status(request: Hapi.Request, h: Hapi.ResponseToolkit) {
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
    }

    public async syncing(request: Hapi.Request, h: Hapi.ResponseToolkit) {
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

    public async configuration(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const network = this.config.get("network");
        const dynamicFees = app.resolveOptions("transaction-pool").dynamicFees;

        return {
            data: {
                coreVersion: app.getVersion(),
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

    public async configurationCrypto() {
        return {
            data: Managers.configManager.getPreset(this.config.get("network").name),
        };
    }

    public async fees(request: Hapi.Request) {
        const { transactionsBusinessRepository } = app.resolvePlugin<Database.IDatabaseService>("database");

        // @ts-ignore
        const results = await transactionsBusinessRepository.getFeeStatistics(request.query.days);

        return { meta: { days: request.query.days }, data: results };
    }
}
