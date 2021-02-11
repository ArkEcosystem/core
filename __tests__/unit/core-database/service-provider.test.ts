import "jest-extended";

import { defaults } from "@packages/core-database/src/defaults";
import { ServiceProvider } from "@packages/core-database/src/service-provider";
import { Application, Container, Providers } from "@packages/core-kernel";
import { AnySchema } from "joi";
import { createConnection, getCustomRepository } from "typeorm";

jest.mock("typeorm", () => {
    return Object.assign(jest.requireActual("typeorm"), {
        createConnection: jest.fn(),
        getCustomRepository: jest.fn(),
    });
});

let app: Application;

const logger = {
    debug: jest.fn(),
    info: jest.fn(),
};

const events = {
    dispatch: jest.fn(),
};

beforeEach(() => {
    app = new Application(new Container.Container());
    app.bind(Container.Identifiers.LogService).toConstantValue(logger);
    app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(events);

    logger.debug.mockReset();
    logger.info.mockReset();
    events.dispatch.mockReset();
});

describe("ServiceProvider.register", () => {
    it("should connect to database, bind triggers, and bind services", async () => {
        const serviceProvider = app.resolve(ServiceProvider);
        const pluginConfiguration = app.resolve(Providers.PluginConfiguration).from("core-database", defaults);
        serviceProvider.setConfig(pluginConfiguration);

        await serviceProvider.register();

        expect(createConnection).toBeCalled();
        expect(getCustomRepository).toBeCalledTimes(3);

        expect(events.dispatch).toBeCalled();

        expect(app.isBound(Container.Identifiers.DatabaseConnection)).toBe(true);
        expect(app.isBound(Container.Identifiers.DatabaseRoundRepository)).toBe(true);
        expect(app.isBound(Container.Identifiers.DatabaseBlockRepository)).toBe(true);
        expect(app.isBound(Container.Identifiers.DatabaseBlockFilter)).toBe(true);
        expect(app.isBound(Container.Identifiers.BlockHistoryService)).toBe(true);
        expect(app.isBound(Container.Identifiers.DatabaseTransactionRepository)).toBe(true);
        expect(app.isBound(Container.Identifiers.DatabaseTransactionFilter)).toBe(true);
        expect(app.isBound(Container.Identifiers.TransactionHistoryService)).toBe(true);
        expect(app.isBound(Container.Identifiers.DatabaseModelConverter)).toBe(true);
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

describe("ServiceProvider.configSchema", () => {
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        for (const key of Object.keys(process.env)) {
            if (key.includes("CORE_DB_")) {
                delete process.env[key];
            }
        }

        process.env.CORE_TOKEN = "ark";
        process.env.CORE_NETWORK_NAME = "testnet";
    });

    it("should validate schema using defaults", async () => {
        jest.resetModules();
        const result = (serviceProvider.configSchema() as AnySchema).validate(
            (await import("@packages/core-database/src/defaults")).defaults,
        );

        expect(result.error).toBeUndefined();

        expect(result.value.connection.type).toEqual("postgres");
        expect(result.value.connection.host).toEqual("localhost");
        expect(result.value.connection.port).toEqual(5432);
        expect(result.value.connection.database).toEqual("ark_testnet");
        expect(result.value.connection.username).toEqual("ark");
        expect(result.value.connection.password).toBeString();
        expect(result.value.connection.entityPrefix).toBeString();
        expect(result.value.connection.synchronize).toBeFalse();
        expect(result.value.connection.logging).toBeFalse();
    });

    it("should allow configuration extension", async () => {
        jest.resetModules();
        const defaults = (await import("@packages/core-database/src/defaults")).defaults;

        // @ts-ignore
        defaults.customField = "dummy";

        const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

        expect(result.error).toBeUndefined();
        expect(result.value.customField).toEqual("dummy");
    });

    describe("process.env.CORE_DB_HOST", () => {
        it("should return value of process.env.CORE_DB_HOST if defined", async () => {
            process.env.CORE_DB_HOST = "custom_hostname";

            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-database/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();
            expect(result.value.connection.host).toEqual("custom_hostname");
        });
    });

    describe("process.env.CORE_DB_PORT", () => {
        it("should return value of process.env.CORE_DB_PORT if defined", async () => {
            process.env.CORE_DB_PORT = "123";

            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-database/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();
            expect(result.value.connection.port).toEqual(123);
        });
    });

    describe("process.env.CORE_DB_DATABASE", () => {
        it("should return value of process.env.CORE_DB_PORT if defined", async () => {
            process.env.CORE_DB_DATABASE = "custom_database";

            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-database/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();
            expect(result.value.connection.database).toEqual("custom_database");
        });
    });

    describe("process.env.CORE_DB_USERNAME", () => {
        it("should return value of process.env.CORE_DB_USERNAME if defined", async () => {
            process.env.CORE_DB_USERNAME = "custom_username";

            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-database/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();
            expect(result.value.connection.username).toEqual("custom_username");
        });
    });

    describe("process.env.CORE_DB_PASSWORD", () => {
        it("should return value of process.env.CORE_DB_PASSWORD if defined", async () => {
            process.env.CORE_DB_PASSWORD = "custom_password";

            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-database/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();
            expect(result.value.connection.password).toEqual("custom_password");
        });
    });

    describe("schema restrictions", () => {
        let defaults;

        beforeEach(async () => {
            jest.resetModules();
            defaults = (await import("@packages/core-database/src/defaults")).defaults;
        });

        it("connection is required", async () => {
            delete defaults.connection;
            const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection" is required');
        });

        it("connection.type is required && is string", async () => {
            defaults.connection.type = false;
            let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.type" must be a string');

            delete defaults.connection.type;
            result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.type" is required');
        });

        it("connection.host is required && is string", async () => {
            defaults.connection.host = false;
            let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.host" must be a string');

            delete defaults.connection.host;
            result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.host" is required');
        });

        it("connection.port is required && is integer && is >= 1 and <= 65535", async () => {
            defaults.connection.port = false;
            let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.port" must be a number');

            defaults.connection.port = 1.12;
            result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.port" must be an integer');

            defaults.connection.port = 0;
            result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.port" must be greater than or equal to 1');

            defaults.connection.port = 65536;
            result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.port" must be less than or equal to 65535');

            delete defaults.connection.port;
            result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.port" is required');
        });

        it("connection.database is required && is string", async () => {
            defaults.connection.database = false;
            let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.database" must be a string');

            delete defaults.connection.database;
            result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.database" is required');
        });

        it("connection.username is required && is string", async () => {
            defaults.connection.username = false;
            let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.username" must be a string');

            delete defaults.connection.username;
            result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.username" is required');
        });

        it("connection.password is required && is string", async () => {
            defaults.connection.password = false;
            let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.password" must be a string');

            delete defaults.connection.password;
            result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.password" is required');
        });

        it("connection.entityPrefix is required && is string", async () => {
            defaults.connection.entityPrefix = false;
            let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.entityPrefix" must be a string');

            delete defaults.connection.entityPrefix;
            result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.entityPrefix" is required');
        });

        it("connection.synchronize is required && is boolean", async () => {
            defaults.connection.synchronize = 123;
            let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.synchronize" must be a boolean');

            delete defaults.connection.synchronize;
            result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.synchronize" is required');
        });

        it("connection.logging is required && is boolean", async () => {
            defaults.connection.logging = 123;
            let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.logging" must be a boolean');

            delete defaults.connection.logging;
            result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error!.message).toEqual('"connection.logging" is required');
        });
    });
});
