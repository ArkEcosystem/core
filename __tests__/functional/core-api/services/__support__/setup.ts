import {
    DelegateSearchService,
    Identifiers as ApiIdentifiers,
    LockSearchService,
    ServiceProvider as ApiServiceProvider,
    WalletSearchService,
} from "@arkecosystem/core-api";
import { Application, Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";
import { ServiceProvider as StateServiceProvider } from "@arkecosystem/core-state";
import { ServiceProvider as TransactionsServiceProvider } from "@arkecosystem/core-transactions";
import { wallet } from "@tests/unit/crypto/blocks/__fixtures__/wallet";

type MockOf<T extends (...args: unknown[]) => unknown> = jest.Mock<ReturnType<T>, Parameters<T>>;

export type TestEnvironment = {
    walletRepository: Contracts.State.WalletRepository;
    walletSearchService: WalletSearchService;
    delegateSearchService: DelegateSearchService;
    lockSearchService: LockSearchService;
    stateStoreMock: {
        getLastBlock: MockOf<Contracts.State.StateStore["getLastBlock"]>;
    };
};

export const setUp = async (): Promise<TestEnvironment> => {
    const app = new Application(new Container.Container());

    app.bind(Container.Identifiers.TriggerService).toConstantValue({
        bind: jest.fn(),
    });

    const stateServiceProvider = app.resolve(StateServiceProvider);
    const transactionsServiceProvider = app.resolve(TransactionsServiceProvider);
    const apiServiceProvider = app.resolve(ApiServiceProvider);

    apiServiceProvider.setConfig(
        app.resolve(Providers.PluginConfiguration).merge({
            server: {
                http: { enabled: false },
                https: { enabled: false },
            },
        }),
    );

    await stateServiceProvider.register();
    await transactionsServiceProvider.register();
    await apiServiceProvider.register();

    const stateStoreMock = {
        getLastBlock: jest.fn(),
    };

    app.rebind(Container.Identifiers.StateStore).toConstantValue(stateStoreMock);

    const walletAttributes = app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes);
    walletAttributes.set("delegate.username");
    walletAttributes.set("delegate.resigned");
    walletAttributes.set("delegate.voteBalance");
    walletAttributes.set("delegate");
    walletAttributes.set("htlc.locks");
    walletAttributes.set("ipfs.hashes");

    const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    const walletSearchService = app.get<WalletSearchService>(ApiIdentifiers.WalletSearchService);
    const delegateSearchService = app.get<DelegateSearchService>(ApiIdentifiers.DelegateSearchService);
    const lockSearchService = app.get<LockSearchService>(ApiIdentifiers.LockSearchService);

    return { walletRepository, walletSearchService, delegateSearchService, lockSearchService, stateStoreMock };
};
