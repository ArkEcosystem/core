import { Services } from "@arkecosystem/core-kernel";
import { ActionArguments } from "@arkecosystem/core-kernel/src/types";
import { BlockProcessor } from "../processor";
import { Interfaces } from "@arkecosystem/crypto";

export class ProcessBlockAction extends Services.Triggers.Action {
    public execute(args: ActionArguments): any {
        let blockProcessor: BlockProcessor = args.blockProcessor;
        let block: Interfaces.IBlock = args.block;

        return blockProcessor.process(block);
    }
}
