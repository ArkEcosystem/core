import { Console } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/config-database";
import envfile from "envfile";
import fs from "fs-extra";
import prompts from "prompts";
import { dirSync, setGracefulCleanup } from "tmp";

let cli;
let envFile: string;

beforeEach(() => {
    process.env.CORE_PATH_CONFIG = dirSync().name;

    envFile = `${process.env.CORE_PATH_CONFIG}/.env`;

    cli = new Console();
});

afterAll(() => setGracefulCleanup());

describe("DatabaseCommand", () => {
    describe("Flags", () => {
        it("should throw if the .env file does not exist", async () => {
            await expect(cli.withFlags({ host: "localhost" }).execute(Command)).rejects.toThrow(
                `No environment file found at ${process.env.CORE_PATH_CONFIG}/.env.`,
            );
        });

        it("should set the database host", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

            // Act
            await cli.withFlags({ host: "localhost" }).execute(Command);

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, "CORE_DB_HOST=localhost");

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
        });

        it("should set the database port", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

            // Act
            await cli.withFlags({ port: "5432" }).execute(Command);

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, "CORE_DB_PORT=5432");

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
        });

        it("should set the database name", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

            // Act
            await cli.withFlags({ database: "ark_mainnet" }).execute(Command);

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, "CORE_DB_DATABASE=ark_mainnet");

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
        });

        it("should set the name of the database user", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

            // Act
            await cli.withFlags({ username: "ark" }).execute(Command, { flags: { username: "ark" } });

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, "CORE_DB_USERNAME=ark");

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
        });

        it("should set the database password", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

            // Act
            await cli.withFlags({ password: "password" }).execute(Command, { flags: { password: "password" } });

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, "CORE_DB_PASSWORD=password");

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
        });
    });

    describe("Prompts", () => {
        it("should throw if the .env file does not exist", async () => {
            await expect(cli.withFlags({ host: "localhost" }).execute(Command)).rejects.toThrow(
                `No environment file found at ${process.env.CORE_PATH_CONFIG}/.env.`,
            );
        });

        it("should set the database host", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

            // Act
            prompts.inject(["localhost", undefined, undefined, undefined, undefined, true]);

            await cli.execute(Command);

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_DB_HOST=localhost"));

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
        });

        it("should set the database port", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

            // Act
            prompts.inject([undefined, 5000, undefined, undefined, undefined, true]);

            await cli.execute(Command);

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_DB_PORT=5000"));

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
        });

        it("should set the database name", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

            // Act
            prompts.inject([undefined, undefined, "ark_mainnet", undefined, undefined, true]);

            await cli.execute(Command);

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_DB_DATABASE=ark_mainnet"));

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
        });

        it("should set the name of the database user", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

            // Act
            prompts.inject([undefined, undefined, undefined, "ark", undefined, true]);

            await cli.execute(Command);

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_DB_USERNAME=ark"));

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
        });

        it("should set the database password", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

            // Act
            prompts.inject([undefined, undefined, undefined, undefined, "password", true]);

            await cli.execute(Command);

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_DB_PASSWORD=password"));

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
        });

        it("should not update without a confirmation", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

            // Act
            prompts.inject([undefined, undefined, undefined, undefined, "password", false]);

            await expect(cli.execute(Command)).rejects.toThrow("You'll need to confirm the input to continue.");

            // Assert
            expect(existsSync).not.toHaveBeenCalled();
            expect(parseFileSync).not.toHaveBeenCalled();
            expect(writeFileSync).not.toHaveBeenCalled();

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
        });
    });
});
