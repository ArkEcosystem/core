import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Action } from "../contracts";

@Container.injectable()
export class DownloadPaused implements Action {
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    public async handle(): Promise<void> {
        this.logger.info("Blockchain download paused");
    }
}
