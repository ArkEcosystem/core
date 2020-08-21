import { ServiceProvider as ApiServiceProvider } from "@arkecosystem/core-api";
import { Application, Container, Providers, Services } from "@arkecosystem/core-kernel";
import { ServiceProvider as StateServiceProvider } from "@arkecosystem/core-state";
import { ServiceProvider as TransactionsServiceProvider } from "@arkecosystem/core-transactions";

export const setUp = async (): Promise<Application> => {
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

    return app;
};
