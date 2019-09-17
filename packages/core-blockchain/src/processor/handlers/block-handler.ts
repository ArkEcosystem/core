import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockProcessorResult } from "../block-processor";

@Container.injectable()
export abstract class BlockHandler {
    @Container.inject(Container.Identifiers.BlockchainService)
    protected readonly blockchain: Contracts.Blockchain.Blockchain;

    public async execute(block: Interfaces.IBlock): Promise<BlockProcessorResult> {
        this.blockchain.resetLastDownloadedBlock();

        return BlockProcessorResult.Rejected;
    }
}
