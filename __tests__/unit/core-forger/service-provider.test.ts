import { ServiceProvider } from "@packages/core-forger/src/service-provider";
import { DelegateFactory } from "@packages/core-forger/src/delegate-factory";
import { Container, Application, Providers } from "@packages/core-kernel";
import { Pm2ProcessActionsService } from "@packages/core-kernel/src/services/process-actions/drivers/pm2";

describe("ServiceProvider", () => {
    let app: Application;
    let serviceProvider: ServiceProvider;

    const triggerService = { bind: jest.fn() };

    const bip39DelegateMock = { address: "D6Z26L69gdk8qYmTv5uzk3uGepigtHY4ax" } as any;
    const bip38DelegateMock = { address: "D6Z26L69gbk8qYmTv5uzk3uGepigtHY4ax" } as any;

    beforeEach(() => {
        app = new Application(new Container.Container());

        app.bind(Container.Identifiers.LogService).toConstantValue({});
        app.bind(Container.Identifiers.EventDispatcherService).toConstantValue({ listen: jest.fn() });
        app.bind(Container.Identifiers.BlockchainService).toConstantValue({});
        app.bind(Container.Identifiers.WalletRepository).toConstantValue({});
        app.bind(Container.Identifiers.TriggerService).toConstantValue(triggerService);
        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
        app.bind(Container.Identifiers.ProcessActionsService).to(Pm2ProcessActionsService).inSingletonScope();

        app.config("delegates", { secrets: [], bip38: "dummy bip 38" });
        app.config("app", { flags: { bip38: "dummy bip 38", password: "dummy pwd" } });

        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        const pluginConfiguration = app.resolve<Providers.PluginConfiguration>(Providers.PluginConfiguration);
        pluginConfiguration.from("core-forger", {
            // @ts-ignore
            hosts: [],
            tracker: true,
        });
        serviceProvider.setConfig(pluginConfiguration);

        jest.spyOn(DelegateFactory, "fromBIP39").mockReturnValue(bip39DelegateMock);
        jest.spyOn(DelegateFactory, "fromBIP38").mockReturnValue(bip38DelegateMock);
    });

    describe("register", () => {
        it("should bind ForgerService, ForgeNewBlockAction, IsForgingAllowedAction", async () => {
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
            app.config("delegates", { secrets: ["this is a super secret passphrase"], bip38: "dummy bip 38" });

            const forgerService = { boot: jest.fn() };
            app.bind(Container.Identifiers.ForgerService).toConstantValue(forgerService);

            await serviceProvider.boot();

            expect(forgerService.boot).toBeCalledTimes(1);
        });

        it("should create delegates from delegates.secret and flags.bip38 / flags.password", async () => {
            const secrets = ["this is a super secret passphrase", "this is a super secret passphrase2"];
            app.config("delegates", { secrets, bip38: "dummy bip 38" });

            const flagsConfig = { bip38: "dummy bip38", password: "dummy password" };
            app.config("app.flags", flagsConfig);

            const forgerService = { boot: jest.fn() };
            app.bind(Container.Identifiers.ForgerService).toConstantValue(forgerService);

            const anotherBip39DelegateMock = { address: "D6Z26L69gdk8qYmTv5uzk3uGepigtHY4fe" } as any;
            jest.spyOn(DelegateFactory, "fromBIP39").mockReturnValueOnce(anotherBip39DelegateMock);

            await serviceProvider.boot();

            expect(forgerService.boot).toBeCalledTimes(1);
            expect(forgerService.boot).toBeCalledWith([anotherBip39DelegateMock, bip39DelegateMock, bip38DelegateMock]);
        });

        it("should call boot on forger service with empty array when no delegates are configured", async () => {
            app.config("delegates", { secrets: [], bip38: undefined });
            app.config("app", { flags: { bip38: undefined, password: undefined } });

            const forgerService = { boot: jest.fn() };
            app.bind(Container.Identifiers.ForgerService).toConstantValue(forgerService);

            await serviceProvider.boot();

            expect(forgerService.boot).toBeCalledTimes(1);
            expect(forgerService.boot).toBeCalledWith([]);
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

            app.config("delegates", { secrets: ["shhhh"], bip38: undefined });

            const bootWhenResultSecrets = await serviceProvider.bootWhen();

            expect(bootWhenResultSecrets).toBeTrue();
        });
    });
});
