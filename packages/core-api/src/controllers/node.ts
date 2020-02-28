import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Crypto, Managers, Transactions } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";

import { PortsResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class NodeController extends Controller {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    protected readonly transactionPoolConfiguration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.ConfigRepository)
    protected readonly configRepository!: Services.Config.ConfigRepository;

    @Container.inject(Container.Identifiers.BlockchainService)
    protected readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.PeerNetworkMonitor)
    protected readonly networkMonitor!: Contracts.P2P.NetworkMonitor;

    @Container.inject(Container.Identifiers.TransactionRepository)
    protected readonly transactionRepository!: Repositories.TransactionRepository;

    public async status(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const lastBlock = this.blockchain.getLastBlock();
        const networkHeight = this.networkMonitor.getNetworkHeight();

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
        const networkHeight = this.networkMonitor.getNetworkHeight();

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
        const results = await this.transactionRepository.getFeeStatistics(request.query.days);

        const groupedByTypeGroup = {};
        for (const result of results) {
            if (!groupedByTypeGroup[result.typeGroup]) {
                groupedByTypeGroup[result.typeGroup] = {};
            }

            const internalType = Transactions.InternalTransactionType.from(result.type, result.typeGroup);
            const handler = this.app
                .getTagged<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry, "state", "null")
                .getRegisteredHandlerByType(internalType);

            groupedByTypeGroup[result.typeGroup][handler.getConstructor().key] = {
                avg: result.avg,
                max: result.max,
                min: result.min,
                sum: result.sum,
            };
        }

        return { meta: { days: request.query.days }, data: groupedByTypeGroup };
    }
}
