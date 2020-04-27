import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { ActionArguments } from "@arkecosystem/core-kernel/src/types";

import { DatabaseService } from "../database-service";

export class GetActiveDelegatesAction extends Services.Triggers.Action {
    private app: Contracts.Kernel.Application;

    public constructor(app: Contracts.Kernel.Application) {
        super();
        this.app = app;
    }

    public async execute(args: ActionArguments): Promise<Contracts.State.Wallet[]> {
        const roundInfo: Contracts.Shared.RoundInfo = args.roundInfo;
        const delegates: Contracts.State.Wallet[] = args.delegates;

        const database: DatabaseService = this.app.get<DatabaseService>(Container.Identifiers.DatabaseService);

        return database.getActiveDelegates(roundInfo, delegates);
    }
}
