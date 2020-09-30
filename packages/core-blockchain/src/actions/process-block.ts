import { Services, Types } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockProcessor, BlockProcessorResult } from "../processor";

export class ProcessBlockAction extends Services.Triggers.Action {
    public async execute(args: Types.ActionArguments): Promise<BlockProcessorResult> {
        const blockProcessor: BlockProcessor = args.blockProcessor;
        const block: Interfaces.IBlock = args.block;

        return blockProcessor.process(block);
    }
}
