import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";
export declare class VerificationFailedHandler extends BlockHandler {
    execute(): Promise<BlockProcessorResult>;
}
