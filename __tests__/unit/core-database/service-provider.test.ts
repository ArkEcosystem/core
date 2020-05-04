import { Application, Container, Providers } from "@arkecosystem/core-kernel";

import { defaults } from "../../../packages/core-database/src/defaults";
import { ServiceProvider } from "../../../packages/core-database/src/service-provider";

let app: Application;

const logger = {
    debug: jest.fn(),
    info: jest.fn(),
};

const triggers = {
    bind: jest.fn(),
};

beforeEach(() => {
    app = new Application(new Container.Container());
    app.bind(Container.Identifiers.LogService).toConstantValue(logger);
    app.bind(Container.Identifiers.TriggerService).toConstantValue(triggers);

    logger.debug.mockReset();
    logger.info.mockReset();
    triggers.bind.mockReset();
});

describe("ServiceProvider.register", () => {
    it("should connect to database, bind triggers, and bind services", async () => {
        const serviceProvider = app.resolve(ServiceProvider);
        const pluginConfiguration = app.resolve(Providers.PluginConfiguration).from("core-database", defaults);
        serviceProvider.setConfig(pluginConfiguration);

        serviceProvider.connect = jest.fn();
        serviceProvider.getRoundRepository = jest.fn();
        serviceProvider.getBlockRepository = jest.fn();
        serviceProvider.getTransactionRepository = jest.fn();

        await serviceProvider.register();

        expect(serviceProvider.connect).toBeCalled();
        expect(serviceProvider.getRoundRepository).toBeCalled();
        expect(serviceProvider.getBlockRepository).toBeCalled();
        expect(serviceProvider.getTransactionRepository).toBeCalled();

        expect(triggers.bind).toBeCalled();

        expect(app.isBound(Container.Identifiers.DatabaseConnection)).toBe(true);
        expect(app.isBound(Container.Identifiers.DatabaseRoundRepository)).toBe(true);
        expect(app.isBound(Container.Identifiers.DatabaseBlockRepository)).toBe(true);
        expect(app.isBound(Container.Identifiers.DatabaseBlockModelConverter)).toBe(true);
        expect(app.isBound(Container.Identifiers.DatabaseBlockFilter)).toBe(true);
        expect(app.isBound(Container.Identifiers.BlockHistoryService)).toBe(true);
        expect(app.isBound(Container.Identifiers.DatabaseTransactionRepository)).toBe(true);
        expect(app.isBound(Container.Identifiers.DatabaseTransactionModelConverter)).toBe(true);
        expect(app.isBound(Container.Identifiers.DatabaseTransactionFilter)).toBe(true);
        expect(app.isBound(Container.Identifiers.TransactionHistoryService)).toBe(true);
        expect(app.isBound(Container.Identifiers.DatabaseService)).toBe(true);
    });
});

describe("ServiceProvider.boot", () => {
    it("should call DatabaseService.initialize method", async () => {
        const serviceProvider = app.resolve(ServiceProvider);

        const databaseService = { initialize: jest.fn() };
        app.bind(Container.Identifiers.DatabaseService).toConstantValue(databaseService);

        await serviceProvider.boot();

        expect(databaseService.initialize).toBeCalled();
    });
});

describe("ServiceProvider.dispose", () => {
    it("should call DatabaseService.disconnect method", async () => {
        const serviceProvider = app.resolve(ServiceProvider);

        const databaseService = { disconnect: jest.fn() };
        app.bind(Container.Identifiers.DatabaseService).toConstantValue(databaseService);

        await serviceProvider.dispose();

        expect(databaseService.disconnect).toBeCalled();
    });
});

describe("ServiceProvider.required", () => {
    it("should return true", async () => {
        const serviceProvider = app.resolve(ServiceProvider);
        const result = await serviceProvider.required();
        expect(result).toBe(true);
    });
});
