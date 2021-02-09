import "jest-extended";

import { Container } from "@packages/core-kernel";
import { ServiceProvider } from "@packages/core-snapshots/src";
import { Sandbox } from "@packages/core-test-framework";
import { AnySchema } from "joi";
import * as typeorm from "typeorm";

let sandbox: Sandbox;

const spyOnGetCustomRepository = jest.spyOn(typeorm, "getCustomRepository").mockReturnValue(undefined);
const spyOnCreateConnection = jest.spyOn(typeorm, "createConnection").mockResolvedValue({
    close: jest.fn(),
} as any);

ServiceProvider.prototype.config = jest.fn().mockReturnValue({
    all: jest.fn().mockReturnValue({
        connection: {},
    }),
});

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue({});
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        serviceProvider = sandbox.app.resolve<ServiceProvider>(ServiceProvider);
    });

    it("should register", async () => {
        await expect(serviceProvider.register()).toResolve();
        expect(spyOnGetCustomRepository).toHaveBeenCalledTimes(3);
        expect(spyOnCreateConnection).toHaveBeenCalled();
    });

    it("should register is default connection is already active", async () => {
        sandbox.app.bind(Container.Identifiers.DatabaseConnection).toConstantValue({});

        await expect(serviceProvider.register()).toResolve();
        expect(spyOnGetCustomRepository).toHaveBeenCalledTimes(3);
        expect(spyOnCreateConnection).toHaveBeenCalled();
    });

    it("should dispose", async () => {
        await expect(serviceProvider.register()).toResolve();
        expect(spyOnGetCustomRepository).toHaveBeenCalled();
        expect(spyOnCreateConnection).toHaveBeenCalled();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should not be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeTrue();
    });

    describe("ServiceProvider.configSchema", () => {
        beforeEach(() => {
            serviceProvider = sandbox.app.resolve<ServiceProvider>(ServiceProvider);

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
                (await import("@packages/core-snapshots/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();

            expect(result.value.updateStep).toBeNumber();

            expect(result.value.connection.type).toEqual("postgres");
            expect(result.value.connection.host).toEqual("localhost");
            expect(result.value.connection.port).toEqual(5432);
            expect(result.value.connection.database).toEqual("ark_testnet");
            expect(result.value.connection.username).toEqual("ark");
            expect(result.value.connection.password).toBeString();
            expect(result.value.connection.entityPrefix).toBeString();
            expect(result.value.connection.synchronize).toBeFalse();
            expect(result.value.connection.logging).toBeFalse();

            expect(result.value.cryptoPackages).toEqual(["@arkecosystem/core-magistrate-crypto"]);
        });

        it("should allow configuration extension", async () => {
            jest.resetModules();
            const defaults = (await import("@packages/core-snapshots/src/defaults")).defaults;

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
                    (await import("@packages/core-snapshots/src/defaults")).defaults,
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
                    (await import("@packages/core-snapshots/src/defaults")).defaults,
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
                    (await import("@packages/core-snapshots/src/defaults")).defaults,
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
                    (await import("@packages/core-snapshots/src/defaults")).defaults,
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
                    (await import("@packages/core-snapshots/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.connection.password).toEqual("custom_password");
            });
        });

        describe("schema restrictions", () => {
            let defaults;

            beforeEach(async () => {
                jest.resetModules();
                defaults = (await import("@packages/core-snapshots/src/defaults")).defaults;
            });

            it("updateStep is required && is integer && >= 1 && <= 2000", async () => {
                defaults.updateStep = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"updateStep" must be a number');

                defaults.updateStep = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"updateStep" must be an integer');

                defaults.updateStep = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"updateStep" must be greater than or equal to 1');

                defaults.updateStep = 5000;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"updateStep" must be less than or equal to 2000');

                delete defaults.updateStep;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"updateStep" is required');
            });

            it("connection is required && is object", async () => {
                defaults.connection = true;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"connection" must be of type object');

                delete defaults.connection;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

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

            it("connection.port is required && is integer && >= 1 && <= 65535", async () => {
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

            it("cryptoPackages is required && is array && contain strings", async () => {
                defaults.cryptoPackages = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"cryptoPackages" must be an array');

                defaults.cryptoPackages = [false];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"cryptoPackages[0]" must be a string');

                delete defaults.cryptoPackages;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"cryptoPackages" is required');
            });
        });
    });
});
