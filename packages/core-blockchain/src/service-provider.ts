import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { Blockchain } from "./blockchain";
import { StateMachine } from "./state-machine";
import { blockchainMachine } from "./state-machine/machine";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app
            .bind(Container.Identifiers.StateMachine)
            .to(StateMachine)
            .inSingletonScope();

        const blockchain: Blockchain = this.app.resolve<Blockchain>(Blockchain);

        this.app.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);

        blockchain.initialize(this.config().all()); // ? why it isn't in boot?

        this.app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore).reset(blockchainMachine);
    }

    public async boot(): Promise<void> {
        await this.app.get<Blockchain>(Container.Identifiers.BlockchainService).boot();
    }

    public async dispose(): Promise<void> {
        await this.app.get<Blockchain>(Container.Identifiers.BlockchainService).dispose();
    }

    public async bootWhen(): Promise<boolean> {
        // todo: remove this; the code shouldn't know that a test suite exists
        return !process.env.CORE_SKIP_BLOCKCHAIN;
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
