import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, EventEmitter, Logger, P2P, TransactionPool } from "@arkecosystem/core-interfaces";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Crypto } from "@arkecosystem/crypto";

export const acceptNewPeer = async ({ service, req }: { service: P2P.IPeerService; req }): Promise<void> => {
    await service.getProcessor().validateAndAcceptPeer({ ip: req.data.ip });
};

export const emitEvent = ({ req }): void => {
    app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter").emit(req.data.event, req.data.body);
};

export const getUnconfirmedTransactions = async (): Promise<P2P.IUnconfirmedTransactions> => {
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    const { maxTransactions } = app.getConfig().getMilestone(blockchain.getLastBlock().data.height).block;

    const transactionPool: TransactionPool.IConnection = app.resolvePlugin<TransactionPool.IConnection>(
        "transaction-pool",
    );

    return {
        transactions: await transactionPool.getTransactionsForForging(maxTransactions),
        poolSize: await transactionPool.getPoolSize(),
    };
};

export const getCurrentRound = async (): Promise<P2P.ICurrentRound> => {
    const config = app.getConfig();
    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const lastBlock = blockchain.getLastBlock();

    const height = lastBlock.data.height + 1;
    const roundInfo = roundCalculator.calculateRound(height);
    const { maxDelegates, round } = roundInfo;

    const blockTime = config.getMilestone(height).blocktime;
    const reward = config.getMilestone(height).reward;
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

export const getNetworkState = async ({ service }: { service: P2P.IPeerService }): Promise<P2P.INetworkState> => {
    return service.getMonitor().getNetworkState();
};

export const syncBlockchain = (): void => {
    app.resolvePlugin<Logger.ILogger>("logger").debug("Blockchain sync check WAKEUP requested by forger");

    app.resolvePlugin<Blockchain.IBlockchain>("blockchain").forceWakeup();
};
