import { Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockState } from "./block-state";
import { DposPreviousRoundState, DposState } from "./dpos";
import { StateBuilder } from "./state-builder";
import { BlockStore } from "./stores/blocks";
import { StateStore } from "./stores/state";
import { TransactionStore } from "./stores/transactions";
import { TransactionValidator } from "./transaction-validator";
import { Wallet, WalletRepository, WalletRepositoryClone, WalletRepositoryCopyOnWrite } from "./wallets";
import {
    addressesIndexer,
    ipfsIndexer,
    locksIndexer,
    publicKeysIndexer,
    resignationsIndexer,
    usernamesIndexer,
} from "./wallets/wallet-indexes";

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
        this.registerFactories();
        this.registerIndexers();

        this.app
            .bind(Container.Identifiers.WalletRepository)
            .to(WalletRepository)
            .inSingletonScope()
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "blockchain"));

        this.app
            .bind(Container.Identifiers.WalletRepository)
            .to(WalletRepositoryClone)
            .inRequestScope()
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "clone"));

        this.app
            .bind(Container.Identifiers.WalletRepository)
            .to(WalletRepositoryCopyOnWrite)
            .inRequestScope()
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "copy-on-write"));

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

    private registerIndexers(): void {
        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: Contracts.State.WalletIndexes.Addresses, indexer: addressesIndexer });

        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: Contracts.State.WalletIndexes.PublicKeys, indexer: publicKeysIndexer });

        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: Contracts.State.WalletIndexes.Usernames, indexer: usernamesIndexer });

        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: Contracts.State.WalletIndexes.Resignations, indexer: resignationsIndexer });

        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: Contracts.State.WalletIndexes.Locks, indexer: locksIndexer });

        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: Contracts.State.WalletIndexes.Ipfs, indexer: ipfsIndexer });
    }
}
