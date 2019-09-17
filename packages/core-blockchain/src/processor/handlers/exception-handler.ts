import { app, Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockProcessorResult } from "../block-processor";
import { AcceptBlockHandler } from "./accept-block-handler";
import { BlockHandler } from "./block-handler";

@Container.injectable()
export class ExceptionHandler extends BlockHandler {
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger: Contracts.Kernel.Log.Logger;

    @Container.inject(Container.Identifiers.DatabaseService)
    private readonly database: Contracts.Database.DatabaseService;

    public async execute(block: Interfaces.IBlock): Promise<BlockProcessorResult> {
        // Ensure the block has not been forged yet, as an exceptional block bypasses all other checks.
        const forgedBlock: Interfaces.IBlock = await this.database.getBlock(block.data.id);

        if (forgedBlock) {
            return super.execute(block);
        }

        this.logger.warning(`Block ${block.data.height.toLocaleString()} (${block.data.id}) forcibly accepted.`);

        return app.resolve<AcceptBlockHandler>(AcceptBlockHandler).execute(block);
    }
}
