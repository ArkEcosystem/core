import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";

import { Application, Container, Contracts, Providers, Services } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { Identities, Utils } from "@packages/crypto";
import { One, Two } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerProvider } from "@packages/core-transactions/src/handlers/handler-provider";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import {
    BridgechainRegistrationTransactionHandler,
    BusinessRegistrationTransactionHandler,
} from "@packages/core-magistrate-transactions/src/handlers";
import {
    addressesIndexer,
    ipfsIndexer, locksIndexer,
    publicKeysIndexer,
    usernamesIndexer,
} from "@packages/core-state/src/wallets/indexers/indexers";
import {
    bridgechainIndexer,
    businessIndexer,
    MagistrateIndex,
} from "@packages/core-magistrate-transactions/src/wallet-indexes";
import {
    BlockchainMocks,
    BlockRepositoryMocks, NetworkMonitorMocks,
    PeerStorageMocks, RoundRepositoryMocks,
    StateStoreMocks, TransactionPoolProcessorMocks, TransactionPoolQueryMocks, TransactionRepositoryMocks,
} from "@tests/unit/core-api/mocks";

export type PaginatedResponse = {
    totalCount: number,
    results: object[],
    meta: object
}

export type ItemResponse = {
    data: object
}

export const parseObjectWithBigInt = (item) => {
    return JSON.parse(JSON.stringify(item, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value
    ));
};

export const buildSenderWallet = (app: Application, passphrase: string | null = null): Contracts.State.Wallet => {
    let walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    let wallet: Contracts.State.Wallet = walletRepository.createWallet(Identities.Address.fromPassphrase(passphrase ? passphrase : passphrases[0]));

    wallet.publicKey = Identities.PublicKey.fromPassphrase(passphrase ? passphrase : passphrases[0]);
    wallet.balance = Utils.BigNumber.make(7527654310);

    return wallet
};

export const initApp = (): Application => {
    let app = new Application(new Container.Container());

    app
        .bind(Container.Identifiers.PluginConfiguration)
        .to(Providers.PluginConfiguration)
        .inSingletonScope();

    app
        .bind(Container.Identifiers.StateStore)
        .toConstantValue(StateStoreMocks.stateStore);

    app
        .bind(Container.Identifiers.BlockchainService)
        .toConstantValue(BlockchainMocks.blockchain);

    app
        .bind(Container.Identifiers.BlockRepository)
        .toConstantValue(BlockRepositoryMocks.blockRepository);

    app
        .bind(Container.Identifiers.TransactionRepository)
        .toConstantValue(TransactionRepositoryMocks.transactionRepository);

    app
        .bind(Container.Identifiers.PeerNetworkMonitor)
        .toConstantValue(NetworkMonitorMocks.networkMonitor);

    app
        .bind(Container.Identifiers.PeerStorage)
        .toConstantValue(PeerStorageMocks.peerStorage);

    app
        .bind(Container.Identifiers.RoundRepository)
        .toConstantValue(RoundRepositoryMocks.roundRepository);

    app
        .bind(Container.Identifiers.TransactionPoolQuery)
        .toConstantValue(TransactionPoolQueryMocks.transactionPoolQuery);

    app
        .bind(Container.Identifiers.TransactionPoolProcessor)
        .toConstantValue(TransactionPoolProcessorMocks.transactionPoolProcessor);

    app
        .bind(Container.Identifiers.TransactionPoolProcessorFactory)
        .toFactory(() => () => {
            return TransactionPoolProcessorMocks.transactionPoolProcessor
        });

    app
        .bind(Container.Identifiers.EventDispatcherService)
        .toConstantValue({});

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

    app
        .bind<Services.Attributes.AttributeSet>(Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet)
        .inSingletonScope();

    app
        .bind<Contracts.State.WalletIndexerIndex>(Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({ name: Contracts.State.WalletIndexes.Addresses, indexer: addressesIndexer });

    app
        .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({ name: Contracts.State.WalletIndexes.PublicKeys, indexer: publicKeysIndexer });

    app
        .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({ name: Contracts.State.WalletIndexes.Usernames, indexer: usernamesIndexer });

    app
        .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({ name: Contracts.State.WalletIndexes.Ipfs, indexer: ipfsIndexer });

    app
        .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({ name: Contracts.State.WalletIndexes.Locks, indexer: locksIndexer });

    app
        .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({ name: MagistrateIndex.Businesses, indexer: businessIndexer });

    app
        .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({ name: MagistrateIndex.Bridgechains, indexer: bridgechainIndexer });

    app
        .bind(Identifiers.WalletFactory)
        .toFactory<Contracts.State.Wallet>((context: Container.interfaces.Context) => (address: string) =>
            new Wallets.Wallet(
                address,
                new Services.Attributes.AttributeMap(
                    context.container.get<Services.Attributes.AttributeSet>(Identifiers.WalletAttributes),
                ),
            ),
        );

    app
        .bind(Identifiers.WalletRepository)
        .to(Wallets.WalletRepository)
        .inSingletonScope();

    return app;
};
