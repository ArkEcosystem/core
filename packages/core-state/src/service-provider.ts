import { Container, Providers, Services } from "@arkecosystem/core-kernel";

import { BlockStore } from "./stores/blocks";
import { StateStore } from "./stores/state";
import { TransactionStore } from "./stores/transactions";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.get<Services.Attributes.AttributeService>(Container.Identifiers.AttributeService).set("wallet");

        this.app.bind(Container.Identifiers.StateBlockStore).toConstantValue(new BlockStore(1000));

        this.app.bind(Container.Identifiers.StateTransactionStore).toConstantValue(new TransactionStore(1000));

        this.app
            .bind(Container.Identifiers.StateStore)
            .to(StateStore)
            .inSingletonScope();

        this.app.bind("state.options").toConstantValue(this.config().all());
    }
}
