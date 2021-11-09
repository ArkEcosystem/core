import { ServiceProvider as ApiServiceProvider } from "@packages/core-api/src";
import { Application, Container, Providers, Services } from "@packages/core-kernel";
import { ServiceProvider as StateServiceProvider } from "@packages/core-state";
import { ServiceProvider as TransactionsServiceProvider } from "@packages/core-transactions";

export const setUp = async (): Promise<Application> => {
    const app = new Application(new Container.Container());

    const triggersServiceProvider = app.resolve(Services.Triggers.ServiceProvider);
    const eventsServiceProvider = app.resolve(Services.Events.ServiceProvider);
    const searchServiceProvider = app.resolve(Services.Search.ServiceProvider);
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

    await triggersServiceProvider.register();
    await eventsServiceProvider.register();
    await searchServiceProvider.register();
    await stateServiceProvider.register();
    await transactionsServiceProvider.register();
    await apiServiceProvider.register();

    app.rebind(Container.Identifiers.StateStore).toConstantValue(null);

    const walletAttributes = app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes);
    walletAttributes.set("delegate.username");
    walletAttributes.set("delegate.resigned");
    walletAttributes.set("delegate.voteBalance");
    walletAttributes.set("delegate");
    walletAttributes.set("htlc.locks");
    walletAttributes.set("ipfs.hashes");

    return app;
};
