import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, EventEmitter, Logger, P2P } from "@arkecosystem/core-interfaces";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Crypto, Interfaces } from "@arkecosystem/crypto";

export function emitEvent({ req }): void {
    app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter").emit(req.data.event, req.data.body);
}

export function getUnconfirmedTransactions(): {
    transactions: string[];
    poolSize: number;
    count: number;
} {
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    const { maxTransactions } = app.getConfig().getMilestone(blockchain.getLastBlock().data.height).block;

    return blockchain.getUnconfirmedTransactions(maxTransactions);
}

export async function getCurrentRound(): Promise<{
    current: number;
    reward: string;
    timestamp: number;
    delegates: Database.IDelegateWallet[];
    currentForger: Database.IDelegateWallet;
    nextForger: Database.IDelegateWallet;
    lastBlock: Interfaces.IBlockData;
    canForge: boolean;
}> {
    const config = app.getConfig();
    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const lastBlock = blockchain.getLastBlock();

    const height = lastBlock.data.height + 1;
    const roundInfo = roundCalculator.calculateRound(height);
    const { maxDelegates } = roundInfo;

    const blockTime = config.getMilestone(height).blocktime;
    const reward = config.getMilestone(height).reward;
    const delegates = await databaseService.getActiveDelegates(roundInfo);
    const timestamp = Crypto.slots.getTime();
    const blockTimestamp = Crypto.slots.getSlotNumber(timestamp) * blockTime;
    const currentForger = parseInt((timestamp / blockTime) as any) % maxDelegates;
    const nextForger = (parseInt((timestamp / blockTime) as any) + 1) % maxDelegates;

    return {
        current: roundInfo.round,
        reward,
        timestamp: blockTimestamp,
        delegates,
        currentForger: delegates[currentForger],
        nextForger: delegates[nextForger],
        lastBlock: lastBlock.data,
        canForge: parseInt((1 + lastBlock.data.timestamp / blockTime) as any) * blockTime < timestamp - 1,
    };
}

export async function getNetworkState({ service }: { service: P2P.IPeerService }): Promise<P2P.INetworkState> {
    return service.getMonitor().getNetworkState();
}

export function syncBlockchain(): void {
    app.resolvePlugin<Logger.ILogger>("logger").debug("Blockchain sync check WAKEUP requested by forger");

    app.resolvePlugin<Blockchain.IBlockchain>("blockchain").forceWakeup();
}
