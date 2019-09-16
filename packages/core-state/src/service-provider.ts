import { Container, Providers, Services } from "@arkecosystem/core-kernel";

import { StateService } from "./service";
import { BlockStore } from "./stores/blocks";
import { StateStore } from "./stores/state";
import { TransactionStore } from "./stores/transactions";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.get<Services.Attributes.AttributeService>(Container.Identifiers.AttributeService).set("wallet");

        this.app.bind(Container.Identifiers.StateService).toConstantValue(
            new StateService({
                blocks: new BlockStore(1000),
                transactions: new TransactionStore(1000),
                storage: new StateStore(),
            }),
        );

        this.app.bind("state.options").toConstantValue(this.config().all());
    }
}
