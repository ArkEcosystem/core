import { ServiceProvider as ApiServiceProvider } from "@arkecosystem/core-api";
import { ServiceProvider as MagistrateApiServiceProvider } from "@arkecosystem/core-magistrate-api/src";
import { Application, Container, Providers, Services } from "@arkecosystem/core-kernel";
import { ServiceProvider as StateServiceProvider } from "@arkecosystem/core-state";
import { ServiceProvider as TransactionsServiceProvider } from "@arkecosystem/core-transactions";
import { ServiceProvider as MagistrateTransactionsServiceProvider } from "@arkecosystem/core-magistrate-transactions";

export const setUp = async (): Promise<Application> => {
    const app = new Application(new Container.Container());

    const triggersServiceProvider = app.resolve(Services.Triggers.ServiceProvider);
    const eventsServiceProvider = app.resolve(Services.Events.ServiceProvider);
    const searchServiceProvider = app.resolve(Services.Search.ServiceProvider);
    const stateServiceProvider = app.resolve(StateServiceProvider);
    const transactionsServiceProvider = app.resolve(TransactionsServiceProvider);
    const magistrateTransactionsServiceProvider = app.resolve(MagistrateTransactionsServiceProvider);
    const apiServiceProvider = app.resolve(ApiServiceProvider);
    const magistrateApiServiceProvider = app.resolve(MagistrateApiServiceProvider);

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
    await magistrateTransactionsServiceProvider.register();
    await apiServiceProvider.register();
    await magistrateApiServiceProvider.register();

    app.rebind(Container.Identifiers.StateStore).toConstantValue(null);

    const walletAttributes = app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes);
    walletAttributes.set("delegate.username");
    walletAttributes.set("delegate.resigned");
    walletAttributes.set("delegate.voteBalance");
    walletAttributes.set("delegate");
    walletAttributes.set("htlc.locks");
    walletAttributes.set("ipfs.hashes");
    walletAttributes.set("entities");
    walletAttributes.set("business");
    walletAttributes.set("business.businessAsset");
    walletAttributes.set("business.transactionId");
    walletAttributes.set("business.bridgechains");
    walletAttributes.set("business.bridgechains.bridgechain");
    walletAttributes.set("business.bridgechains.bridgechain.resigned");
    walletAttributes.set("business.resigned");

    return app;
};
