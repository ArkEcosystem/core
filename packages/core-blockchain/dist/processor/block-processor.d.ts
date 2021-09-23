import { Interfaces } from "@arkecosystem/crypto";
import { Blockchain } from "../blockchain";
import { BlockHandler } from "./handlers";
export declare enum BlockProcessorResult {
    Accepted = 0,
    DiscardedButCanBeBroadcasted = 1,
    Rejected = 2,
    Rollback = 3
}
export declare class BlockProcessor {
    private readonly blockchain;
    private readonly logger;
    constructor(blockchain: Blockchain);
    process(block: Interfaces.IBlock): Promise<BlockProcessorResult>;
    getHandler(block: Interfaces.IBlock): Promise<BlockHandler>;
    private verifyBlock;
    private checkBlockContainsForgedTransactions;
    /**
     * Check if a block contains incompatible transactions and should thus be rejected.
     */
    private blockContainsIncompatibleTransactions;
    /**
     * For a given sender, v2 transactions must have strictly increasing nonce without gaps.
     */
    private blockContainsOutOfOrderNonce;
}
