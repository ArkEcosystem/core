import { Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";

import { BlockState } from "./block-state";
import { StateBuilder } from "./state-builder";
import { BlockStore } from "./stores/blocks";
import { StateStore } from "./stores/state";
import { TransactionStore } from "./stores/transactions";
import { Wallet, WalletRepository, WalletState } from "./wallets";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.registerFactories();

        this.app
            .bind(Container.Identifiers.WalletRepository)
            .to(WalletRepository)
            .inSingletonScope()
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "blockchain"));

        this.app
            .bind(Container.Identifiers.WalletState)
            .to(WalletState)
            .inSingletonScope();

        this.app
            .bind(Container.Identifiers.BlockState)
            .to(BlockState)
            .inSingletonScope();

        this.app.bind(Container.Identifiers.StateBlockStore).toConstantValue(new BlockStore(1000));
        this.app.bind(Container.Identifiers.StateTransactionStore).toConstantValue(new TransactionStore(1000));

        this.app
            .bind(Container.Identifiers.StateStore)
            .to(StateStore)
            .inSingletonScope();
    }

    public async boot(): Promise<void> {
        await this.app.resolve<StateBuilder>(StateBuilder).run();
    }

    public async bootWhen(serviceProvider?: string): Promise<boolean> {
        return serviceProvider === "@arkecosystem/core-database";
    }

    private registerFactories(): void {
        this.app
            .bind(Container.Identifiers.WalletFactory)
            .toFactory<Contracts.State.Wallet>((context: Container.interfaces.Context) => (address: string) =>
                new Wallet(
                    address,
                    new Services.Attributes.AttributeMap(
                        context.container.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes),
                    ),
                ),
            );
    }
}
