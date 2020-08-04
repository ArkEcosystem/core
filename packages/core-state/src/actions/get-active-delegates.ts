import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { ActionArguments } from "@arkecosystem/core-kernel/src/types";

import { DatabaseInteraction } from "../database-interactions";

export class GetActiveDelegatesAction extends Services.Triggers.Action {
    private app: Contracts.Kernel.Application;

    public constructor(app: Contracts.Kernel.Application) {
        super();
        this.app = app;
    }

    public async execute(args: ActionArguments): Promise<Contracts.State.Wallet[]> {
        const roundInfo: Contracts.Shared.RoundInfo = args.roundInfo;
        const delegates: Contracts.State.Wallet[] = args.delegates;

        const databaseInteractions: DatabaseInteraction = this.app.get<DatabaseInteraction>(
            Container.Identifiers.DatabaseInteraction,
        );

        return databaseInteractions.getActiveDelegates(roundInfo, delegates);
    }
}
