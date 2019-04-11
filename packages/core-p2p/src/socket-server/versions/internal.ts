import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, EventEmitter, Logger, P2P } from "@arkecosystem/core-interfaces";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Crypto, Interfaces, Transactions } from "@arkecosystem/crypto";
import { validate } from "../utils/validate";
import { schema } from "./peer/schema";

export function emitEvent({ req }): void {
    validate(
        {
            type: "object",
            required: ["event", "body"],
            additionalProperties: false,
            properties: {
                event: { type: "string" },
                body: { type: "object" },
            },
        },
        req.data,
    );

    app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter").emit(req.data.event, req.data.body);
}

export async function verifyTransaction({ req }): Promise<{ data: { valid: boolean } }> {
    validate(
        {
            type: "object",
            required: ["transaction"],
            additionalProperties: false,
            properties: {
                transaction: { $ref: "transaction" },
            },
        },
        req.data,
    );

    return {
        data: {
            valid: await app
                .resolvePlugin<Database.IDatabaseService>("database")
                .verifyTransaction(Transactions.Transaction.fromBytes(req.data.transaction)),
        },
    };
}

export function getUnconfirmedTransactions(): {
    data: {
        transactions: string[];
        poolSize: number;
        count: number;
    };
} {
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    const { maxTransactions } = app.getConfig().getMilestone(blockchain.getLastBlock().data.height).block;

    return {
        data: blockchain.getUnconfirmedTransactions(maxTransactions),
    };
}

export async function getCurrentRound(): Promise<{
    data: {
        current: number;
        reward: string;
        timestamp: number;
        delegates: Database.IDelegateWallet[];
        currentForger: Database.IDelegateWallet;
        nextForger: Database.IDelegateWallet;
        lastBlock: Interfaces.IBlockData;
        canForge: boolean;
    };
}> {
    const config = app.getConfig();
    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const lastBlock = blockchain.getLastBlock();
    const roundInfo = roundCalculator.calculateRound(lastBlock.data.height);

    const height = lastBlock.data.height + 1;
    const maxActive = config.getMilestone(height).activeDelegates;
    const blockTime = config.getMilestone(height).blocktime;
    const reward = config.getMilestone(height).reward;
    const delegates = await databaseService.getActiveDelegates(roundInfo);
    const timestamp = Crypto.slots.getTime();

    const currentForger = parseInt((timestamp / blockTime) as any) % maxActive;
    const nextForger = (parseInt((timestamp / blockTime) as any) + 1) % maxActive;

    return {
        data: {
            current: +(height / maxActive),
            reward,
            timestamp,
            delegates,
            currentForger: delegates[currentForger],
            nextForger: delegates[nextForger],
            lastBlock: lastBlock.data,
            canForge: parseInt((1 + lastBlock.data.timestamp / blockTime) as any) * blockTime < timestamp - 1,
        },
    };
}

export async function getNetworkState({
    service,
}: {
    service: P2P.IPeerService;
}): Promise<{ data: P2P.INetworkState }> {
    return {
        data: await service.getMonitor().getNetworkState(),
    };
}

export function storeBlock({ req }): void {
    validate(schema.postBlock, req.data);

    req.data.block.ip = req.headers.remoteAddress;

    app.resolvePlugin<Blockchain.IBlockchain>("blockchain").handleIncomingBlock(req.data.block);
}

export function syncBlockchain(): void {
    app.resolvePlugin<Logger.ILogger>("logger").debug("Blockchain sync check WAKEUP requested by forger");

    app.resolvePlugin<Blockchain.IBlockchain>("blockchain").forceWakeup();
}
