import { ServiceProvider } from "../../../packages/core-blockchain/src/service-provider";
import { Container, Application, Providers } from "@arkecosystem/core-kernel";

describe("ServiceProvider", () => {
    let app: Application;
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        app = new Application(new Container.Container());

        app.bind(Container.Identifiers.StateStore).toConstantValue({ reset: jest.fn() });
        app.bind(Container.Identifiers.DatabaseService).toConstantValue({});
        app.bind(Container.Identifiers.BlockRepository).toConstantValue({});
        app.bind(Container.Identifiers.TransactionPoolService).toConstantValue({});
        app.bind(Container.Identifiers.LogService).toConstantValue({});
        app.bind(Container.Identifiers.EventDispatcherService).toConstantValue({});
        app.bind(Container.Identifiers.TransactionRepository).toConstantValue({});
        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
        
        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    describe("register", () => {
        it("should bind blockchain and state machine", async () => {
            const pluginConfiguration = app.resolve<Providers.PluginConfiguration>(Providers.PluginConfiguration);
            serviceProvider.setConfig(pluginConfiguration);

            expect(app.isBound(Container.Identifiers.StateMachine)).toBeFalse();
            expect(app.isBound(Container.Identifiers.BlockchainService)).toBeFalse();

            await serviceProvider.register();

            expect(app.isBound(Container.Identifiers.StateMachine)).toBeTrue();
            expect(app.isBound(Container.Identifiers.BlockchainService)).toBeTrue();
        })
    })

    describe("boot", () => {
        it("should call boot on blockchain service", async () => {
            const blockchainService = { boot: jest.fn() };
            app.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchainService);

            await serviceProvider.boot();

            expect(blockchainService.boot).toBeCalledTimes(1);
        })
    })

    describe("dispose", () => {
        it("should call dispose on blockchain service", async () => {
            const blockchainService = { dispose: jest.fn() };
            app.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchainService);

            await serviceProvider.dispose();

            expect(blockchainService.dispose).toBeCalledTimes(1);
        })
    })

    describe("bootWhen", () => {
        it("should return false when process.env.CORE_SKIP_BLOCKCHAIN", async () => {
            process.env.CORE_SKIP_BLOCKCHAIN = "true";
            
            const bootWhenResult = await serviceProvider.bootWhen();

            expect(bootWhenResult).toBeFalse();
        })

        it("should return true when !process.env.CORE_SKIP_BLOCKCHAIN", async () => {
            delete process.env.CORE_SKIP_BLOCKCHAIN;
            
            const bootWhenResult = await serviceProvider.bootWhen();

            expect(bootWhenResult).toBeTrue();
        })
    })

    describe("required", () => {
        it("should return true", async () => {
            const required = await serviceProvider.required();

            expect(required).toBeTrue();
        })
    })
})