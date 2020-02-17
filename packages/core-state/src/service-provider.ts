import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockState } from "./block-state";
import { DposPreviousRoundState, DposState } from "./dpos";
import { StateBuilder } from "./state-builder";
import { BlockStore } from "./stores/blocks";
import { StateStore } from "./stores/state";
import { TransactionStore } from "./stores/transactions";
import { TransactionValidator } from "./transaction-validator";
import { TempWalletRepository, WalletRepository } from "./wallets";
import { registerFactories, registerIndexers } from "./wallets/indexers";

const dposPreviousRoundStateProvider = (context: Container.interfaces.Context) => {
    return async (
        blocks: Interfaces.IBlock[],
        roundInfo: Contracts.Shared.RoundInfo,
    ): Promise<Contracts.State.DposPreviousRoundState> => {
        const previousRound = context.container.resolve(DposPreviousRoundState);
        await previousRound.revert(blocks, roundInfo);
        return previousRound;
    };
};

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        registerFactories(this.app);
        registerIndexers(this.app);

        this.app
            .bind(Container.Identifiers.WalletRepository)
            .to(WalletRepository)
            .inSingletonScope()
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "blockchain"));

        this.app
            .bind(Container.Identifiers.WalletRepository)
            .to(TempWalletRepository)
            .inRequestScope()
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "temp"));

        this.app.bind(Container.Identifiers.DposState).to(DposState);
        this.app.bind(Container.Identifiers.BlockState).to(BlockState);

        this.app.bind(Container.Identifiers.StateBlockStore).toConstantValue(new BlockStore(1000));
        this.app.bind(Container.Identifiers.StateTransactionStore).toConstantValue(new TransactionStore(1000));

        this.app
            .bind(Container.Identifiers.StateStore)
            .to(StateStore)
            .inSingletonScope();

        this.app
            .bind<Contracts.State.DposPreviousRoundStateProvider>(Container.Identifiers.DposPreviousRoundStateProvider)
            .toProvider(dposPreviousRoundStateProvider);

        this.app.bind(Container.Identifiers.TransactionValidator).to(TransactionValidator);

        this.app
            .bind(Container.Identifiers.TransactionValidatorFactory)
            .toAutoFactory(Container.Identifiers.TransactionValidator);
    }

    public async boot(): Promise<void> {
        await this.app.resolve<StateBuilder>(StateBuilder).run();
    }

    public async bootWhen(serviceProvider?: string): Promise<boolean> {
        return serviceProvider === "@arkecosystem/core-database";
    }
}
