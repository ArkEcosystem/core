import { Application, Container, Contracts, Providers, Services } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import {
    BridgechainRegistrationTransactionHandler,
    BusinessRegistrationTransactionHandler,
} from "@packages/core-magistrate-transactions/src/handlers";
import {
    bridgechainIndexer,
    businessIndexer,
    MagistrateIndex,
    entityIndexer,
} from "@packages/core-magistrate-transactions/src/wallet-indexes";
import { Wallets } from "@packages/core-state";
import {
    addressesIndexer,
    ipfsIndexer,
    locksIndexer,
    publicKeysIndexer,
    usernamesIndexer,
} from "@packages/core-state/src/wallets/indexers/indexers";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { One, Two } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerProvider } from "@packages/core-transactions/src/handlers/handler-provider";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Identities, Utils } from "@packages/crypto";
import { EntityTransactionHandler } from "@arkecosystem/core-magistrate-transactions/src/handlers/entity";

export type PaginatedResponse = {
    totalCount: number;
    results: [object];
    meta: object;
};

export type ItemResponse = {
    data: object;
};

export const buildSenderWallet = (app: Application): Contracts.State.Wallet => {
    const walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    const wallet: Contracts.State.Wallet = walletRepository.createWallet(
        Identities.Address.fromPassphrase(passphrases[0]),
    );

    wallet.publicKey = Identities.PublicKey.fromPassphrase(passphrases[0]);
    wallet.balance = Utils.BigNumber.make(7527654310);

    return wallet;
};

export const initApp = (): Application => {
    const app = new Application(new Container.Container());

    app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
    app.bind(Container.Identifiers.LogService).toConstantValue({});
    app.bind(Container.Identifiers.StateStore).toConstantValue({});
    app.bind(Container.Identifiers.BlockchainService).toConstantValue({});
    app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue({});
    app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue({});
    app.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue({});
    app.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue({});
    app.bind(Container.Identifiers.PeerRepository).toConstantValue({});
    app.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue({});
    app.bind(Container.Identifiers.TransactionPoolProcessorFactory).toConstantValue({});
    app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue({});

    app.bind(Identifiers.TransactionHandler).to(One.TransferTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.TransferTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.SecondSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.SecondSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.DelegateRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.DelegateRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.VoteTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.VoteTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.MultiSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.MultiSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.IpfsTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.MultiPaymentTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.DelegateResignationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.HtlcLockTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.HtlcClaimTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.HtlcRefundTransactionHandler);

    app.bind(Identifiers.TransactionHandlerProvider).to(TransactionHandlerProvider).inSingletonScope();
    app.bind(Identifiers.TransactionHandlerRegistry).to(TransactionHandlerRegistry).inSingletonScope();

    app.bind(Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BridgechainRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(EntityTransactionHandler);

    app.bind<Services.Attributes.AttributeSet>(Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet)
        .inSingletonScope();

    app.bind<Contracts.State.WalletIndexerIndex>(Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Addresses,
        indexer: addressesIndexer,
        autoIndex: true,
    });

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.PublicKeys,
        indexer: publicKeysIndexer,
        autoIndex: true,
    });

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Usernames,
        indexer: usernamesIndexer,
        autoIndex: true,
    });

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Ipfs,
        indexer: ipfsIndexer,
        autoIndex: true,
    });

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Locks,
        indexer: locksIndexer,
        autoIndex: true,
    });

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: MagistrateIndex.Businesses,
        indexer: businessIndexer,
        autoIndex: true,
    });

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: MagistrateIndex.Bridgechains,
        indexer: bridgechainIndexer,
        autoIndex: true,
    });

    app.bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: MagistrateIndex.Entities,
        indexer: entityIndexer,
        autoIndex: true,
    });

    app.bind(Identifiers.WalletFactory).toFactory<Contracts.State.Wallet>(
        (context: Container.interfaces.Context) => (address: string) =>
            new Wallets.Wallet(
                address,
                new Services.Attributes.AttributeMap(
                    context.container.get<Services.Attributes.AttributeSet>(Identifiers.WalletAttributes),
                ),
            ),
    );

    app.bind(Identifiers.WalletRepository).to(Wallets.WalletRepository).inSingletonScope();

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    return app;
};
