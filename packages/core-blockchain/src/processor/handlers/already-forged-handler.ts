import { Container } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";

// todo: remove the abstract and instead require a contract to be implemented
@Container.injectable()
export class AlreadyForgedHandler extends BlockHandler {
    public async execute(block: Interfaces.IBlock): Promise<BlockProcessorResult> {
        // todo: replace this with an actual implementation after the abstract is gone
        await super.execute(block);

        return BlockProcessorResult.DiscardedButCanBeBroadcasted;
    }
}
