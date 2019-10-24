import { Container, Providers } from "@arkecosystem/core-kernel";

import { BlockStore } from "./stores/blocks";
import { StateStore } from "./stores/state";
import { TransactionStore } from "./stores/transactions";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Container.Identifiers.StateBlockStore).toConstantValue(new BlockStore(1000));

        this.app.bind(Container.Identifiers.StateTransactionStore).toConstantValue(new TransactionStore(1000));

        this.app
            .bind(Container.Identifiers.StateStore)
            .to(StateStore)
            .inSingletonScope();
    }
}
