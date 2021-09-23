import { Logger } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { Blockchain } from "../../blockchain";
import { BlockProcessorResult } from "../block-processor";
export declare abstract class BlockHandler {
    protected readonly blockchain: Blockchain;
    protected readonly block: Interfaces.IBlock;
    protected readonly logger: Logger.ILogger;
    constructor(blockchain: Blockchain, block: Interfaces.IBlock);
    execute(): Promise<BlockProcessorResult>;
}
