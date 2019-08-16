import { app, Contracts } from "@arkecosystem/core-kernel";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Crypto, Managers } from "@arkecosystem/crypto";

export const acceptNewPeer = async ({ service, req }: { service: Contracts.P2P.IPeerService; req }): Promise<void> => {
    await service.getProcessor().validateAndAcceptPeer({ ip: req.data.ip });
};

export const emitEvent = ({ req }): void => {
    app.resolve<Contracts.Kernel.IEventDispatcher>("event-emitter").dispatch(req.data.event, req.data.body);
};

export const getUnconfirmedTransactions = async (): Promise<Contracts.P2P.IUnconfirmedTransactions> => {
    const blockchain = app.resolve<Contracts.Blockchain.IBlockchain>("blockchain");
    const { maxTransactions } = Managers.configManager.getMilestone(blockchain.getLastBlock().data.height).block;

    const transactionPool: Contracts.TransactionPool.IConnection = app.resolve<Contracts.TransactionPool.IConnection>(
        "transaction-pool",
    );

    return {
        transactions: await transactionPool.getTransactionsForForging(maxTransactions),
        poolSize: await transactionPool.getPoolSize(),
    };
};

export const getCurrentRound = async (): Promise<Contracts.P2P.ICurrentRound> => {
    const databaseService = app.resolve<Contracts.Database.IDatabaseService>("database");
    const blockchain = app.resolve<Contracts.Blockchain.IBlockchain>("blockchain");

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
    service: Contracts.P2P.IPeerService;
}): Promise<Contracts.P2P.INetworkState> => {
    return service.getMonitor().getNetworkState();
};

export const syncBlockchain = (): void => {
    app.resolve<Contracts.Kernel.ILogger>("logger").debug("Blockchain sync check WAKEUP requested by forger");

    app.resolve<Contracts.Blockchain.IBlockchain>("blockchain").forceWakeup();
};
