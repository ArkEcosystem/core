import { Interfaces } from "@arkecosystem/core-crypto";
import { Services } from "@arkecosystem/core-kernel";
import { ActionArguments } from "@arkecosystem/core-kernel/src/types";

import { BlockProcessor, BlockProcessorResult } from "../processor";

export class ProcessBlockAction extends Services.Triggers.Action {
    public async execute(args: ActionArguments): Promise<BlockProcessorResult> {
        const blockProcessor: BlockProcessor = args.blockProcessor;
        const block: Interfaces.IBlock = args.block;

        return blockProcessor.process(block);
    }
}
