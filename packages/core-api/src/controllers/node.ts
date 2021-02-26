import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Crypto, Managers } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";

import { PortsResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class NodeController extends Controller {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly transactionPoolConfiguration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.TransactionHandlerRegistry)
    @Container.tagged("state", "null")
    private readonly nullHandlerRegistry!: Handlers.Registry;

    @Container.inject(Container.Identifiers.ConfigRepository)
    private readonly configRepository!: Services.Config.ConfigRepository;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.PeerNetworkMonitor)
    private readonly networkMonitor!: Contracts.P2P.NetworkMonitor;

    @Container.inject(Container.Identifiers.DatabaseTransactionRepository)
    private readonly transactionRepository!: Repositories.TransactionRepository;

    public async status(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const lastBlock = this.blockchain.getLastBlock();
        const networkHeight = this.networkMonitor.getNetworkHeight();

        return {
            data: {
                synced: this.blockchain.isSynced(),
                now: lastBlock ? lastBlock.data.height : 0,
                blocksCount: networkHeight && lastBlock ? networkHeight - lastBlock.data.height : 0,
                timestamp: Crypto.Slots.getTime(),
            },
        };
    }

    public async syncing(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const lastBlock = this.blockchain.getLastBlock();
        const networkHeight = this.networkMonitor.getNetworkHeight();

        return {
            data: {
                syncing: !this.blockchain.isSynced(),
                blocks: networkHeight && lastBlock ? networkHeight - lastBlock.data.height : 0,
                height: lastBlock ? lastBlock.data.height : 0,
                id: lastBlock?.data?.id,
            },
        };
    }

    public async configuration(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const dynamicFees = this.transactionPoolConfiguration.getRequired<{
            enabled?: boolean;
        }>("dynamicFees");

        const network = Managers.configManager.get("network");

        return {
            data: {
                core: {
                    version: this.app.version(),
                },
                nethash: network.nethash,
                slip44: network.slip44,
                wif: network.wif,
                token: network.client.token,
                symbol: network.client.symbol,
                explorer: network.client.explorer,
                version: network.pubKeyHash,
                ports: super.toResource(this.configRepository, PortsResource),
                constants: Managers.configManager.getMilestone(this.blockchain.getLastHeight()),
                transactionPool: {
                    dynamicFees: dynamicFees.enabled ? dynamicFees : { enabled: false },
                    maxTransactionsInPool: this.transactionPoolConfiguration.getRequired<number>(
                        "maxTransactionsInPool",
                    ),
                    maxTransactionsPerSender: this.transactionPoolConfiguration.getRequired<number>(
                        "maxTransactionsPerSender",
                    ),
                    maxTransactionsPerRequest: this.transactionPoolConfiguration.getRequired<number>(
                        "maxTransactionsPerRequest",
                    ),
                    maxTransactionAge: this.transactionPoolConfiguration.getRequired<number>("maxTransactionAge"),
                    maxTransactionBytes: this.transactionPoolConfiguration.getRequired<number>("maxTransactionBytes"),
                },
            },
        };
    }

    public async configurationCrypto() {
        return {
            data: Managers.configManager.all(),
        };
    }

    public async fees(request: Hapi.Request) {
        // @ts-ignore
        const handlers = this.nullHandlerRegistry.getRegisteredHandlers();
        const handlersKey = {};
        const txsTypes: Array<{ type: number, typeGroup: number }> = [];
        for (const handler of handlers) {
            handlersKey[
                `${handler.getConstructor().type}-${handler.getConstructor().typeGroup}`
            ] = handler.getConstructor().key;
            txsTypes.push({ type: handler.getConstructor().type!, typeGroup: handler.getConstructor().typeGroup!});
        }

        const results = await this.transactionRepository.getFeeStatistics(txsTypes, request.query.days);

        const groupedByTypeGroup = {};
        for (const result of results) {
            if (!groupedByTypeGroup[result.typeGroup]) {
                groupedByTypeGroup[result.typeGroup] = {};
            }

            const handlerKey = handlersKey[`${result.type}-${result.typeGroup}`];

            groupedByTypeGroup[result.typeGroup][handlerKey] = {
                avg: result.avg,
                max: result.max,
                min: result.min,
                sum: result.sum,
            };
        }

        return { meta: { days: request.query.days }, data: groupedByTypeGroup };
    }
}
