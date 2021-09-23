import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";
export declare class NonceOutOfOrderHandler extends BlockHandler {
    execute(): Promise<BlockProcessorResult>;
}
