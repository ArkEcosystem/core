import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";

export class NonceOutOfOrderHandler extends BlockHandler {
    public async execute(): Promise<BlockProcessorResult> {
        await super.execute();

        return BlockProcessorResult.Rejected;
    }
}
