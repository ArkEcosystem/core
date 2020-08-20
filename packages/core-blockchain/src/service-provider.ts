import { Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";

import { ProcessBlockAction } from "./actions";
import { Blockchain } from "./blockchain";
import { BlockProcessor } from "./processor";
import { StateMachine } from "./state-machine";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Container.Identifiers.StateMachine).to(StateMachine).inSingletonScope();
        this.app.bind(Container.Identifiers.BlockchainService).to(Blockchain).inSingletonScope();
        this.app.bind(Container.Identifiers.BlockProcessor).to(BlockProcessor).inSingletonScope();

        this.registerActions();
    }

    public async boot(): Promise<void> {
        await this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService).boot();
    }

    public async dispose(): Promise<void> {
        await this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService).dispose();
    }

    public async bootWhen(): Promise<boolean> {
        // todo: remove this; the code shouldn't know that a test suite exists
        return !process.env.CORE_SKIP_BLOCKCHAIN;
    }

    public async required(): Promise<boolean> {
        return true;
    }

    private registerActions(): void {
        this.app
            .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
            .bind("processBlock", new ProcessBlockAction());
    }
}
