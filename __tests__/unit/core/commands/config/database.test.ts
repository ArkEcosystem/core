import envfile from "envfile";
import prompts from "prompts";
import { dirSync, setGracefulCleanup } from "tmp";

import { DatabaseCommand } from "@packages/core/src/commands/config/database";
import fs from "fs-extra";

let envFile: string;
describe("DatabaseCommand", () => {
    beforeEach(() => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        envFile = `${process.env.CORE_PATH_CONFIG}/.env`;
    });

    afterAll(() => setGracefulCleanup());

    describe("Flags", () => {
        it("should throw if the .env file does not exist", async () => {
            await expect(DatabaseCommand.run(["--token=ark", "--network=mainnet", "--host=localhost"])).rejects.toThrow(
                `No environment file found at ${process.env.CORE_PATH_CONFIG}/.env.`,
            );
        });

        it("should set the database host", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

            // Act
            await DatabaseCommand.run(["--token=ark", "--network=mainnet", "--host=localhost"]);

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
            await DatabaseCommand.run(["--token=ark", "--network=mainnet", "--port=5432"]);

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
            await DatabaseCommand.run(["--token=ark", "--network=mainnet", "--database=ark_mainnet"]);

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
            await DatabaseCommand.run(["--token=ark", "--network=mainnet", "--username=ark"]);

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
            await DatabaseCommand.run(["--token=ark", "--network=mainnet", "--password=password"]);

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
            await expect(DatabaseCommand.run(["--token=ark", "--network=mainnet", "--host=localhost"])).rejects.toThrow(
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

            await DatabaseCommand.run(["--token=ark", "--network=mainnet"]);

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
            prompts.inject([undefined, 5432, undefined, undefined, undefined, true]);

            await DatabaseCommand.run(["--token=ark", "--network=mainnet"]);

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
            prompts.inject([undefined, undefined, "ark_mainnet", undefined, undefined, true]);

            await DatabaseCommand.run(["--token=ark", "--network=mainnet"]);

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
            prompts.inject([undefined, undefined, undefined, "ark", undefined, true]);

            await DatabaseCommand.run(["--token=ark", "--network=mainnet"]);

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
            prompts.inject([undefined, undefined, undefined, undefined, "password", true]);

            await DatabaseCommand.run(["--token=ark", "--network=mainnet"]);

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, "CORE_DB_PASSWORD=password");

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

            await expect(DatabaseCommand.run(["--token=ark", "--network=mainnet"])).rejects.toThrow(
                "You'll need to confirm the input to continue.",
            );

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
