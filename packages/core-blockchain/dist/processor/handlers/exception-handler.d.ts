import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";
export declare class ExceptionHandler extends BlockHandler {
    execute(): Promise<BlockProcessorResult>;
}
