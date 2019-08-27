import { app, Contracts } from "@arkecosystem/core-kernel";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Crypto, Managers } from "@arkecosystem/crypto";

export const acceptNewPeer = async ({ service, req }: { service: Contracts.P2P.PeerService; req }): Promise<void> => {
    await service.getProcessor().validateAndAcceptPeer({ ip: req.data.ip });
};

export const emitEvent = ({ req }): void => {
    app.get<Contracts.Kernel.Events.EventDispatcher>("events").dispatch(req.data.event, req.data.body);
};

export const getUnconfirmedTransactions = async (): Promise<Contracts.P2P.UnconfirmedTransactions> => {
    const blockchain = app.get<Contracts.Blockchain.Blockchain>("blockchain");
    const { maxTransactions } = Managers.configManager.getMilestone(blockchain.getLastBlock().data.height).block;

    const transactionPool: Contracts.TransactionPool.Connection = app.get<Contracts.TransactionPool.Connection>(
        "transactionPool",
    );

    return {
        transactions: await transactionPool.getTransactionsForForging(maxTransactions),
        poolSize: await transactionPool.getPoolSize(),
    };
};

export const getCurrentRound = async (): Promise<Contracts.P2P.CurrentRound> => {
    const databaseService = app.get<Contracts.Database.DatabaseService>("database");
    const blockchain = app.get<Contracts.Blockchain.Blockchain>("blockchain");

    const lastBlock = blockchain.getLastBlock();

    const height = lastBlock.data.height + 1;
    const roundInfo = roundCalculator.calculateRound(height);
    const { maxDelegates, round } = roundInfo;

    const blockTime = Managers.configManager.getMilestone(height).blocktime;
    const reward = Managers.configManager.getMilestone(height).reward;
    const delegates = await databaseService.getActiveDelegates(roundInfo);
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

export const getNetworkState = async ({
    service,
}: {
    service: Contracts.P2P.PeerService;
}): Promise<Contracts.P2P.NetworkState> => {
    return service.getMonitor().getNetworkState();
};

export const syncBlockchain = (): void => {
    app.get<Contracts.Kernel.Log.Logger>("log").debug("Blockchain sync check WAKEUP requested by forger");

    app.get<Contracts.Blockchain.Blockchain>("blockchain").forceWakeup();
};
