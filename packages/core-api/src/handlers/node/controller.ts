import { app, Container, Contracts } from "@arkecosystem/core-kernel";
import { Crypto, Managers } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { Controller } from "../shared/controller";

// todo: remove the abstract and use dependency injection if needed
export class NodeController extends Controller {
    public async status(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const lastBlock = this.blockchain.getLastBlock();
            // todo: inject from container
            const networkHeight = app
                .get<Contracts.P2P.NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor)
                .getNetworkHeight();

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
            // todo: inject from container
            const networkHeight = app
                .get<Contracts.P2P.NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor)
                .getNetworkHeight();

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
            const dynamicFees = app.get<any>("transactionPool.options").dynamicFees;

            return {
                data: {
                    core: {
                        version: app.version(),
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
        // todo: inject from container
        const { transactionsBusinessRepository } = app.get<Contracts.Database.DatabaseService>(
            Container.Identifiers.DatabaseService,
        );

        // @ts-ignore
        const results = await transactionsBusinessRepository.getFeeStatistics(request.query.days);

        return { meta: { days: request.query.days }, data: results };
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
