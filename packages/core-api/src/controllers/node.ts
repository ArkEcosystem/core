import { Container, Contracts, Providers, Services, Utils } from "@arkecosystem/core-kernel";
import { Crypto, Managers } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";

import { PortsResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class NodeController extends Controller {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.ConfigRepository)
    protected readonly configRepository!: Services.Config.ConfigRepository;

    @Container.inject(Container.Identifiers.BlockchainService)
    protected readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.DatabaseService)
    protected readonly databaseService!: Contracts.Database.DatabaseService;

    @Container.inject(Container.Identifiers.PeerNetworkMonitor)
    protected readonly networkMonitor!: Contracts.P2P.INetworkMonitor;

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
        const dynamicFees: Record<string, any> | undefined = this.app
            .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
            .get("transactionPool")
            .config()
            .get<{ enabled?: boolean }>("dynamicFees");

        Utils.assert.defined<Record<string, any>>(dynamicFees);

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
        const results = await this.databaseService.transactionsBusinessRepository.getFeeStatistics(request.query.days);

        return { meta: { days: request.query.days }, data: results };
    }
}
