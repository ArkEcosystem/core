import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { Blockchain } from "../../blockchain";
import { BlockProcessorResult } from "../block-processor";

export abstract class BlockHandler {
    protected readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

    public constructor(protected readonly blockchain: Blockchain, protected readonly block: Interfaces.IBlock) {}

    public async execute(): Promise<BlockProcessorResult> {
        this.blockchain.resetLastDownloadedBlock();

        return BlockProcessorResult.Rejected;
    }
}
