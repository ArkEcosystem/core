import { Container, Services } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/config-database";
import prompts from "prompts";
import { dirSync, setGracefulCleanup } from "tmp";

let cli: Console;
let spyOnUpdateVariables;
let envFile: string;

beforeEach(() => {
    process.env.CORE_PATH_CONFIG = dirSync().name;

    envFile = `${process.env.CORE_PATH_CONFIG}/.env`;

    cli = new Console();
    const environment = cli.app.get<Services.Environment>(Container.Identifiers.Environment);
    spyOnUpdateVariables = jest.spyOn(environment, "updateVariables").mockImplementation(() => {});
});

afterAll(() => setGracefulCleanup());

describe("DatabaseCommand", () => {
    describe("Flags", () => {
        it("should set the database host", async () => {
            // Act
            await cli.withFlags({ host: "localhost" }).execute(Command);

            // Assert
            expect(spyOnUpdateVariables).toHaveBeenCalledTimes(1);
            expect(spyOnUpdateVariables).toHaveBeenCalledWith(envFile, { CORE_DB_HOST: "localhost" });
        });

        it("should set the database port", async () => {
            // Act
            await cli.withFlags({ port: "5432" }).execute(Command);

            // Assert
            expect(spyOnUpdateVariables).toHaveBeenCalledTimes(1);
            expect(spyOnUpdateVariables).toHaveBeenCalledWith(envFile, { CORE_DB_PORT: 5432 });
        });

        it("should set the database name", async () => {
            // Act
            await cli.withFlags({ database: "ark_mainnet" }).execute(Command);

            // Assert
            expect(spyOnUpdateVariables).toHaveBeenCalledTimes(1);
            expect(spyOnUpdateVariables).toHaveBeenCalledWith(envFile, { CORE_DB_DATABASE: "ark_mainnet" });
        });

        it("should set the name of the database user", async () => {
            // Act
            await cli.withFlags({ username: "ark" }).execute(Command);

            // Assert
            expect(spyOnUpdateVariables).toHaveBeenCalledTimes(1);
            expect(spyOnUpdateVariables).toHaveBeenCalledWith(envFile, { CORE_DB_USERNAME: "ark" });
        });

        it("should set the database password", async () => {
            // Act
            await cli.withFlags({ password: "password" }).execute(Command);

            // Assert
            expect(spyOnUpdateVariables).toHaveBeenCalledTimes(1);
            expect(spyOnUpdateVariables).toHaveBeenCalledWith(envFile, { CORE_DB_PASSWORD: "password" });
        });
    });

    describe("Prompts", () => {
        const defaultConfig = {
            CORE_DB_HOST: "localhost",
            CORE_DB_PORT: 5432,
            CORE_DB_DATABASE: "ark_testnet",
            CORE_DB_USERNAME: "ark",
            CORE_DB_PASSWORD: "password",
        };

        it("should set the database host", async () => {
            // Act
            prompts.inject(["dummyHost", undefined, undefined, undefined, undefined, true]);

            await cli.execute(Command);

            // Assert
            expect(spyOnUpdateVariables).toHaveBeenCalledTimes(1);
            expect(spyOnUpdateVariables).toHaveBeenCalledWith(envFile, { ...defaultConfig, CORE_DB_HOST: "dummyHost" });
        });

        it("should set the database port", async () => {
            // Act
            prompts.inject([undefined, 5000, undefined, undefined, undefined, true]);

            await cli.execute(Command);

            // Assert
            expect(spyOnUpdateVariables).toHaveBeenCalledTimes(1);
            expect(spyOnUpdateVariables).toHaveBeenCalledWith(envFile, { ...defaultConfig, CORE_DB_PORT: 5000 });
        });

        it("should set the database name", async () => {
            // Act
            prompts.inject([undefined, undefined, "dummyDatabase", undefined, undefined, true]);

            await cli.execute(Command);

            // Assert
            expect(spyOnUpdateVariables).toHaveBeenCalledTimes(1);
            expect(spyOnUpdateVariables).toHaveBeenCalledWith(envFile, {
                ...defaultConfig,
                CORE_DB_DATABASE: "dummyDatabase",
            });
        });

        it("should set the name of the database user", async () => {
            // Act
            prompts.inject([undefined, undefined, undefined, "dummyUsername", undefined, true]);

            await cli.execute(Command);

            // Assert
            expect(spyOnUpdateVariables).toHaveBeenCalledTimes(1);
            expect(spyOnUpdateVariables).toHaveBeenCalledWith(envFile, {
                ...defaultConfig,
                CORE_DB_USERNAME: "dummyUsername",
            });
        });

        it("should set the database password", async () => {
            // Act
            prompts.inject([undefined, undefined, undefined, undefined, "dummyPassword", true]);

            await cli.execute(Command);

            // Assert
            expect(spyOnUpdateVariables).toHaveBeenCalledTimes(1);
            expect(spyOnUpdateVariables).toHaveBeenCalledWith(envFile, {
                ...defaultConfig,
                CORE_DB_PASSWORD: "dummyPassword",
            });
        });

        it("should not update without a confirmation", async () => {
            // Act
            prompts.inject([undefined, undefined, undefined, undefined, undefined, false]);

            await expect(cli.execute(Command)).rejects.toThrow("You'll need to confirm the input to continue.");
        });
    });
});
