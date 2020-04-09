import { ServiceProvider } from "@arkecosystem/core-forger/src/service-provider";
import { DelegateFactory } from "@arkecosystem/core-forger/src/delegate-factory";
import { Container, Application, Providers } from "@arkecosystem/core-kernel";

describe("ServiceProvider", () => {
    let app: Application;
    let serviceProvider: ServiceProvider;

    const triggerService = { bind: jest.fn() };

    beforeEach(() => {
        app = new Application(new Container.Container());

        app.bind(Container.Identifiers.LogService).toConstantValue({});
        app.bind(Container.Identifiers.EventDispatcherService).toConstantValue({});
        app.bind(Container.Identifiers.TriggerService).toConstantValue(triggerService);
        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

        app.config("delegates", { secrets: [], bip38: "dummy bip 38" });
        app.config("app", { flags: { bip38: "dummy bip 38", password: "dummy pwd" } });
        
        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        jest.spyOn(DelegateFactory, "fromBIP39").mockReturnValue({ address: "D6Z26L69gdk8qYmTv5uzk3uGepigtHY4ax"} as any);
        jest.spyOn(DelegateFactory, "fromBIP38").mockReturnValue({ address: "D6Z26L69gdk8qYmTv5uzk3uGepigtHY4ax"} as any);
    });

    describe("register", () => {
        it("should bind ForgerService, ForgeNewBlockAction, IsForgingAllowedAction", async () => {
            const pluginConfiguration = app.resolve<Providers.PluginConfiguration>(Providers.PluginConfiguration);
            pluginConfiguration.set("hosts", []);
            serviceProvider.setConfig(pluginConfiguration);

            expect(app.isBound(Container.Identifiers.ForgerService)).toBeFalse();

            await serviceProvider.register();

            expect(app.isBound(Container.Identifiers.ForgerService)).toBeTrue();
            expect(triggerService.bind).toBeCalledTimes(2);
            expect(triggerService.bind).toBeCalledWith("forgeNewBlock", expect.anything());
            expect(triggerService.bind).toBeCalledWith("isForgingAllowed", expect.anything());
        });
    });

    describe("boot", () => {
        it("should call boot on forger service", async () => {
            const pluginConfiguration = app.resolve<Providers.PluginConfiguration>(Providers.PluginConfiguration);
            serviceProvider.setConfig(pluginConfiguration);
            const forgerService = { boot: jest.fn() };
            app.bind(Container.Identifiers.ForgerService).toConstantValue(forgerService);

            await serviceProvider.boot();

            expect(forgerService.boot).toBeCalledTimes(1);
        });
    });

    describe("dispose", () => {
        it("should call dispose on forger service", async () => {
            const forgerService = { dispose: jest.fn() };
            app.bind(Container.Identifiers.ForgerService).toConstantValue(forgerService);

            await serviceProvider.dispose();

            expect(forgerService.dispose).toBeCalledTimes(1);
        });
    });

    describe("bootWhen", () => {
        it("should return false when there is not bip38 or secrets defined", async () => {
            app.config("delegates", { secrets: [], bip38: undefined });

            const bootWhenResult = await serviceProvider.bootWhen();

            expect(bootWhenResult).toBeFalse();
        });

        it("should return true when bip38 or secrets defined", async () => {
            app.config("delegates", { secrets: [], bip38: "yeah bip 38 defined" });

            const bootWhenResultBip38 = await serviceProvider.bootWhen();

            expect(bootWhenResultBip38).toBeTrue();

            app.config("delegates", { secrets: [ "shhhh" ], bip38: undefined });

            const bootWhenResultSecrets = await serviceProvider.bootWhen();

            expect(bootWhenResultSecrets).toBeTrue();
        });
    });
});
