import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";
export declare class AcceptBlockHandler extends BlockHandler {
    execute(): Promise<BlockProcessorResult>;
    private resetTransactionPool;
}
