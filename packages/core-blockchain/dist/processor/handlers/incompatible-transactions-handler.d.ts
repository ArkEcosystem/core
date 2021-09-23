import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";
export declare class IncompatibleTransactionsHandler extends BlockHandler {
    execute(): Promise<BlockProcessorResult>;
}
