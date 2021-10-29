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
} from "@packages/core-magistrate-transactions/src/wallet-indexes";
import { Wallets } from "@packages/core-state";
import {
    addressesIndexer,
    ipfsIndexer,
    locksIndexer,
    publicKeysIndexer,
    usernamesIndexer,
} from "@packages/core-state/src/wallets/indexers/indexers";
import { Mocks } from "@packages/core-test-framework";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { One, Two } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerProvider } from "@packages/core-transactions/src/handlers/handler-provider";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Identities, Utils } from "@packages/crypto";
import { ServiceProvider } from "@packages/core-transactions/src/service-provider";

export type PaginatedResponse = {
    totalCount: number;
    results: object[];
    meta: object;
};

export type ItemResponse = {
    data: object;
};

export const parseObjectWithBigInt = (item) => {
    return JSON.parse(JSON.stringify(item, (key, value) => (typeof value === "bigint" ? value.toString() : value)));
};

export const buildSenderWallet = (app: Application, passphrase: string | null = null): Contracts.State.Wallet => {
    const walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    const wallet: Contracts.State.Wallet = walletRepository.createWallet(
        Identities.Address.fromPassphrase(passphrase ? passphrase : passphrases[0]),
    );

    wallet.setPublicKey(Identities.PublicKey.fromPassphrase(passphrase ? passphrase : passphrases[0]));
    wallet.setBalance(Utils.BigNumber.make(7527654310));

    return wallet;
};

export const initApp = (): Application => {
    const app = new Application(new Container.Container());
    const logger = { error: jest.fn(), notice: jest.fn() };

    app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

    app.bind(Container.Identifiers.StateStore).toConstantValue(Mocks.StateStore.instance);

    app.bind(Container.Identifiers.BlockchainService).toConstantValue(Mocks.Blockchain.instance);

    app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(Mocks.BlockRepository.instance);

    app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue(Mocks.TransactionRepository.instance);

    app.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue(Mocks.NetworkMonitor.instance);

    app.bind(Container.Identifiers.PeerRepository).toConstantValue(Mocks.PeerRepository.instance);

    app.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue(Mocks.RoundRepository.instance);

    app.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue(Mocks.TransactionPoolQuery.instance);

    app.bind(Container.Identifiers.TransactionPoolProcessor).toConstantValue(Mocks.TransactionPoolProcessor.instance);

    app.bind(Container.Identifiers.TransactionPoolProcessorFactory).toFactory(() => () => {
        return Mocks.TransactionPoolProcessor.instance;
    });

    app.bind(Container.Identifiers.EventDispatcherService).toConstantValue({});

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
    app.bind(Identifiers.TransactionHandlerConstructors).toDynamicValue(
        ServiceProvider.getTransactionHandlerConstructorsBinding(),
    );

    app.bind(Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BridgechainRegistrationTransactionHandler);

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

    return app;
};
