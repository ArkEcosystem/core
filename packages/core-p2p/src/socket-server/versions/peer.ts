import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, Logger, P2P, TransactionPool } from "@arkecosystem/core-interfaces";
import { TransactionGuard } from "@arkecosystem/core-transaction-pool";
import { Crypto, Interfaces } from "@arkecosystem/crypto";
import pluralize from "pluralize";
import { isBlockChained } from "../../../../core-utils/dist";
import { MissingCommonBlockError } from "../../errors";
import { isWhitelisted } from "../../utils";
import { InvalidTransactionsError, UnchainedBlockError } from "../errors";

const transactionPool = app.resolvePlugin<TransactionPool.IConnection>("transaction-pool");
const logger = app.resolvePlugin<Logger.ILogger>("logger");

export async function acceptNewPeer({ service, req }: { service: P2P.IPeerService; req }): Promise<void> {
    const peer = { ip: req.data.ip };

    ["nethash", "version", "port", "os"].forEach(key => {
        peer[key] = req.headers[key];
    });

    await service.getProcessor().validateAndAcceptPeer(peer);
}

export function getPeers({ service }: { service: P2P.IPeerService }): P2P.IPeerBroadcast[] {
    return service
        .getStorage()
        .getPeers()
        .map(peer => peer.toBroadcast())
        .sort((a, b) => a.latency - b.latency);
}

export async function getCommonBlocks({
    req,
}): Promise<{
    common: Interfaces.IBlockData;
    lastBlockHeight: number;
}> {
    const blockchain: Blockchain.IBlockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    const commonBlocks: Interfaces.IBlockData[] = await blockchain.database.getCommonBlocks(req.data.ids);

    if (!commonBlocks.length) {
        throw new MissingCommonBlockError();
    }

    return {
        common: commonBlocks[0],
        lastBlockHeight: blockchain.getLastBlock().data.height,
    };
}

export async function getStatus(): Promise<P2P.IPeerState> {
    const lastBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

    return {
        height: lastBlock ? lastBlock.data.height : 0,
        forgingAllowed: Crypto.slots.isForgingAllowed(),
        currentSlot: Crypto.slots.getSlotNumber(),
        header: lastBlock ? lastBlock.getHeader() : {},
    };
}

export async function postBlock({ req }): Promise<void> {
    const blockchain: Blockchain.IBlockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const block: Interfaces.IBlockData = req.data.block;

    if (!isWhitelisted(app.resolveOptions("p2p").remoteAccess, req.headers.remoteAddress)) {
        if (blockchain.pingBlock(block)) {
            return;
        }

        // @ts-ignore - @TODO: has to be an IBlock
        const lastDownloadedBlock: Interfaces.IBlock = blockchain.getLastDownloadedBlock();

        // @ts-ignore - @TODO: second argument has to be an IBlock
        if (!isBlockChained(lastDownloadedBlock, { data: block })) {
            throw new UnchainedBlockError(lastDownloadedBlock.data.height, block.height);
        }
    }

    blockchain.handleIncomingBlock(block, req.headers.remoteAddress);
}

export async function postTransactions({ service, req }: { service: P2P.IPeerService; req }): Promise<string[]> {
    const guard: TransactionPool.IGuard = new TransactionGuard(transactionPool);
    const result: TransactionPool.IValidationResult = await guard.validate(req.data.transactions);

    if (result.invalid.length > 0) {
        throw new InvalidTransactionsError();
    }

    if (result.broadcast.length > 0) {
        service.getMonitor().broadcastTransactions(guard.getBroadcastTransactions());
    }

    return result.accept;
}

export async function getBlocks({ req }): Promise<Interfaces.IBlockData[]> {
    const database: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    const blockchain: Blockchain.IBlockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const reqBlockHeight: number = +req.data.lastBlockHeight + 1;
    let blocks: Interfaces.IBlockData[] = [];

    if (!req.data.lastBlockHeight || isNaN(reqBlockHeight)) {
        const lastBlock: Interfaces.IBlock = blockchain.getLastBlock();

        if (lastBlock) {
            blocks.push(lastBlock.data);
        }
    } else {
        blocks = await database.getBlocks(reqBlockHeight, 400);
    }

    logger.info(
        `${req.headers.remoteAddress} has downloaded ${pluralize("block", blocks.length, true)} from height ${(!isNaN(
            reqBlockHeight,
        )
            ? reqBlockHeight
            : blocks[0].height
        ).toLocaleString()}`,
    );

    return blocks || [];
}
