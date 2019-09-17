import { Container } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";

@Container.injectable()
export class AlreadyForgedHandler extends BlockHandler {
    public async execute(block: Interfaces.IBlock): Promise<BlockProcessorResult> {
        await super.execute(block);

        return BlockProcessorResult.DiscardedButCanBeBroadcasted;
    }
}
