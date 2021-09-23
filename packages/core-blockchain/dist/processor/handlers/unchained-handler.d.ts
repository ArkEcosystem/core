import { Interfaces } from "@arkecosystem/crypto";
import { Blockchain } from "../../blockchain";
import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";
declare class BlockNotReadyCounter {
    static maxAttempts: number;
    private id;
    private attempts;
    increment(block: Interfaces.IBlock): boolean;
    reset(): void;
}
export declare class UnchainedHandler extends BlockHandler {
    protected readonly blockchain: Blockchain;
    protected readonly block: Interfaces.IBlock;
    private isValidGenerator;
    static notReadyCounter: BlockNotReadyCounter;
    constructor(blockchain: Blockchain, block: Interfaces.IBlock, isValidGenerator: boolean);
    execute(): Promise<BlockProcessorResult>;
    private checkUnchainedBlock;
}
export {};
