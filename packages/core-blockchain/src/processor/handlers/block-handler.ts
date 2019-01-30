import { app, Contracts } from "@arkecosystem/core-kernel";
import { models } from "@arkecosystem/crypto";
import { Blockchain } from "../../blockchain";
import { BlockProcessorResult } from "../block-processor";

export abstract class BlockHandler {
    protected logger: Contracts.Logger.ILogger;

    public constructor(protected blockchain: Blockchain, protected block: models.Block) {
        this.logger = app.resolve<Contracts.Logger.ILogger>("logger");
    }

    public async execute(): Promise<BlockProcessorResult> {
        this.blockchain.resetLastDownloadedBlock();
        return BlockProcessorResult.Rejected;
    }
}
