import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { Crypto, Managers, Interfaces } from "@arkecosystem/crypto";
import { process } from "ipaddr.js";

import { PeerService } from "../../contracts";

// todo: turn this into a class so that ioc can be used
// todo: review the implementation of all methods

export const acceptNewPeer = async ({
    app,
    service,
    req,
}: {
    app: Contracts.Kernel.Application;
    service: PeerService;
    req;
}): Promise<void> => service.processor.validateAndAcceptPeer({ ip: req.data.ip } as Contracts.P2P.Peer);

export const emitEvent = ({ app, req }: { app: Contracts.Kernel.Application; req: any }): void => {
    app.get<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService).dispatch(
        req.data.event,
        req.data.body,
    );
};

export const isPeerOrForger = ({
    app,
    service,
    req,
}: {
    app: Contracts.Kernel.Application;
    service: PeerService;
    req;
}): { isPeerOrForger: boolean } => {
    const sanitizedIp = process(req.data.ip).toString();
    const configuration = app.getTagged<Providers.PluginConfiguration>(
        Container.Identifiers.PluginConfiguration,
        "plugin",
        "@arkecosystem/core-p2p",
    );

    return {
        isPeerOrForger:
            service.storage.hasPeer(sanitizedIp) ||
            Utils.isWhitelisted(configuration.getRequired<string[]>("remoteAccess"), sanitizedIp),
    };
};

export const getUnconfirmedTransactions = async ({
    app,
}: {
    app: Contracts.Kernel.Application;
}): Promise<Contracts.P2P.UnconfirmedTransactions> => {
    const collator: Contracts.TransactionPool.Collator = app.get<Contracts.TransactionPool.Collator>(
        Container.Identifiers.TransactionPoolCollator,
    );
    const transactionPool: Contracts.TransactionPool.Service = app.get<Contracts.TransactionPool.Service>(
        Container.Identifiers.TransactionPoolService,
    );
    const transactions: Interfaces.ITransaction[] = await collator.getBlockCandidateTransactions();

    return {
        poolSize: transactionPool.getPoolSize(),
        transactions: transactions.map(t => t.serialized.toString("hex")),
    };
};

export const getCurrentRound = async ({
    app,
}: {
    app: Contracts.Kernel.Application;
}): Promise<Contracts.P2P.CurrentRound> => {
    const databaseService = app.get<DatabaseService>(Container.Identifiers.DatabaseService);
    const blockchain = app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);

    const lastBlock = blockchain.getLastBlock();

    const height = lastBlock.data.height + 1;
    const roundInfo = Utils.roundCalculator.calculateRound(height);
    const { maxDelegates, round } = roundInfo;

    const blockTime = Managers.configManager.getMilestone(height).blocktime;
    const reward = Managers.configManager.getMilestone(height).reward;
    const delegates: Contracts.P2P.DelegateWallet[] = (await databaseService.getActiveDelegates(roundInfo)).map(
        wallet => ({
            ...wallet,
            delegate: wallet.getAttribute("delegate"),
        }),
    );

    const timestamp = Crypto.Slots.getTime();
    const blockTimestamp = Crypto.Slots.getSlotNumber(timestamp) * blockTime;
    const currentForger = parseInt((timestamp / blockTime) as any) % maxDelegates;
    const nextForger = (parseInt((timestamp / blockTime) as any) + 1) % maxDelegates;

    return {
        current: round,
        reward,
        timestamp: blockTimestamp,
        delegates,
        currentForger: delegates[currentForger],
        nextForger: delegates[nextForger],
        lastBlock: lastBlock.data,
        canForge: parseInt((1 + lastBlock.data.timestamp / blockTime) as any) * blockTime < timestamp - 1,
    };
};

export const getNetworkState = async ({ service }: { service: PeerService }): Promise<Contracts.P2P.NetworkState> =>
    service.networkMonitor.getNetworkState();

export const getRateLimitStatus = async ({
    service,
    req,
}: {
    service: PeerService;
    req: { data: { ip: string; endpoint?: string } };
}): Promise<Contracts.P2P.IRateLimitStatus> => {
    return service.networkMonitor.getRateLimitStatus(req.data.ip, req.data.endpoint);
};

export const isBlockedByRateLimit = async ({
    service,
    req,
}: {
    service: PeerService;
    req: { data: { ip: string } };
}): Promise<{ blocked: boolean }> => {
    return {
        blocked: await service.networkMonitor.isBlockedByRateLimit(req.data.ip),
    };
};

export const syncBlockchain = ({ app }: { app: Contracts.Kernel.Application }): void => {
    app.log.debug("Blockchain sync check WAKEUP requested by forger");

    app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService).forceWakeup();
};

export const getRateLimitedEndpoints = ({ service }: { service: PeerService }): string[] => {
    return service.networkMonitor.getRateLimitedEndpoints();
};
