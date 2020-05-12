import { CryptoManager } from "@arkecosystem/core-crypto";
import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Transactions } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";

import { PortsResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class NodeController extends Controller {
    @Container.inject(Container.Identifiers.CryptoManager)
    private readonly cryptoManager!: CryptoManager;

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
                timestamp: this.cryptoManager.LibraryManager.Crypto.Slots.getTime(),
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

        const network = this.cryptoManager.NetworkConfigManager.get("network");

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
                constants: this.cryptoManager.MilestoneManager.getMilestone(this.blockchain.getLastHeight()),
                transactionPool: {
                    dynamicFees: dynamicFees.enabled ? dynamicFees : { enabled: false },
                },
            },
        };
    }

    public async configurationCrypto() {
        return {
            data: this.cryptoManager.NetworkConfigManager.all(),
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
            const handler = this.nullHandlerRegistry.getRegisteredHandlerByType(internalType);

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
