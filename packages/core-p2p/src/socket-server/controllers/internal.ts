import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { DatabaseInteraction } from "@arkecosystem/core-state";
import { Crypto, Interfaces, Managers } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";

import { Controller } from "./controller";

export class InternalController extends Controller {
    @Container.inject(Container.Identifiers.PeerProcessor)
    private readonly peerProcessor!: Contracts.P2P.PeerProcessor;

    @Container.inject(Container.Identifiers.PeerNetworkMonitor)
    private readonly peerNetworkMonitor!: Contracts.P2P.NetworkMonitor;

    @Container.inject(Container.Identifiers.DatabaseInteraction)
    private readonly databaseInteraction!: DatabaseInteraction;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly events!: Contracts.Kernel.EventDispatcher;

    public async acceptNewPeer(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<void> {
        return this.peerProcessor.validateAndAcceptPeer({ ip: (request.payload as any).ip } as Contracts.P2P.Peer);
    }

    public emitEvent(request: Hapi.Request, h: Hapi.ResponseToolkit): boolean {
        this.events.dispatch((request.payload as any).event, (request.payload as any).body);
        return true;
    }

    public async getUnconfirmedTransactions(
        request: Hapi.Request,
        h: Hapi.ResponseToolkit,
    ): Promise<Contracts.P2P.UnconfirmedTransactions> {
        const collator: Contracts.TransactionPool.Collator = this.app.get<Contracts.TransactionPool.Collator>(
            Container.Identifiers.TransactionPoolCollator,
        );
        const transactionPool: Contracts.TransactionPool.Service = this.app.get<Contracts.TransactionPool.Service>(
            Container.Identifiers.TransactionPoolService,
        );
        const transactions: Interfaces.ITransaction[] = await collator.getBlockCandidateTransactions();

        return {
            poolSize: transactionPool.getPoolSize(),
            transactions: transactions.map((t) => t.serialized.toString("hex")),
        };
    }

    public async getCurrentRound(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Contracts.P2P.CurrentRound> {
        const blockchain = this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);
        const lastBlock = blockchain.getLastBlock();

        const height = lastBlock.data.height + 1;
        const roundInfo = Utils.roundCalculator.calculateRound(height);

        const reward = Managers.configManager.getMilestone(height).reward;
        const delegates: Contracts.P2P.DelegateWallet[] = (
            await this.databaseInteraction.getActiveDelegates(roundInfo)
        ).map((wallet) => ({
            ...wallet,
            delegate: wallet.getAttribute("delegate"),
        }));

        const blockTimeLookup = await Utils.forgingInfoCalculator.getBlockTimeLookup(this.app, height);

        const timestamp = Crypto.Slots.getTime();
        const forgingInfo = Utils.forgingInfoCalculator.calculateForgingInfo(timestamp, height, blockTimeLookup);

        return {
            current: roundInfo.round,
            reward,
            timestamp: forgingInfo.blockTimestamp,
            delegates,
            currentForger: delegates[forgingInfo.currentForger],
            nextForger: delegates[forgingInfo.nextForger],
            lastBlock: lastBlock.data,
            canForge: forgingInfo.canForge,
        };
    }

    public async getNetworkState(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Contracts.P2P.NetworkState> {
        return this.peerNetworkMonitor.getNetworkState();
    }

    public syncBlockchain(request: Hapi.Request, h: Hapi.ResponseToolkit): boolean {
        this.logger.debug("Blockchain sync check WAKEUP requested by forger");

        const blockchain = this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);
        blockchain.forceWakeup();

        return true;
    }
}
