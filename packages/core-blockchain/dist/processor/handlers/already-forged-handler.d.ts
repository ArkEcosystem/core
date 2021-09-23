import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";
export declare class AlreadyForgedHandler extends BlockHandler {
    execute(): Promise<BlockProcessorResult>;
}
