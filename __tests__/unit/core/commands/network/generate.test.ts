import "jest-extended";

import { GenerateCommand } from "@packages/core/src/commands/network/generate";
import { resolve } from "path";
import prompts from "prompts";
import fs from "fs-extra";

jest.mock("fs-extra");

const configCore: string = resolve(__dirname, "../../../../../packages/core/bin/config/mynet7");
const configCrypto: string = resolve(__dirname, "../../../../../packages/crypto/src/networks/mynet7");

describe("GenerateCommand", () => {
    it("should generate a new configuration", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
        const copyFileSync = jest.spyOn(fs, "copyFileSync").mockImplementation();

        await GenerateCommand.run([
            "--network=mynet7",
            "--premine=120000000000",
            "--delegates=47",
            "--blocktime=9",
            "--maxTxPerBlock=122",
            "--maxBlockPayload=123444",
            "--rewardHeight=23000",
            "--rewardAmount=66000",
            "--pubKeyHash=168",
            "--wif=27",
            "--token=myn",
            "--symbol=my",
            "--explorer=myex.io",
        ]);

        expect(existsSync).toHaveBeenCalledWith(configCore);
        expect(existsSync).toHaveBeenCalledWith(configCrypto);

        expect(ensureDirSync).toHaveBeenCalledWith(configCore);
        expect(ensureDirSync).toHaveBeenCalledWith(configCrypto);

        expect(writeJSONSync).toHaveBeenCalledTimes(6); // 4x Core + 2x Crypto

        expect(writeFileSync).toHaveBeenCalled();
        expect(copyFileSync).toHaveBeenCalledTimes(2);

        existsSync.mockReset();
        ensureDirSync.mockReset();
        writeJSONSync.mockReset();
        writeFileSync.mockReset();
        copyFileSync.mockReset();
    });

    it("should throw if the core configuration destination already exists", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);

        await expect(
            GenerateCommand.run([
                "--network=mynet7",
                "--premine=120000000000",
                "--delegates=47",
                "--blocktime=9",
                "--maxTxPerBlock=122",
                "--maxBlockPayload=123444",
                "--rewardHeight=23000",
                "--rewardAmount=66000",
                "--pubKeyHash=168",
                "--wif=27",
                "--token=myn",
                "--symbol=my",
                "--explorer=myex.io",
            ]),
        ).rejects.toThrow(`${configCore} already exists.`);

        existsSync.mockReset();
    });

    it("should throw if the crypto configuration destination already exists", async () => {
        const existsSync = jest
            .spyOn(fs, "existsSync")
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);

        await expect(
            GenerateCommand.run([
                "--network=mynet7",
                "--premine=120000000000",
                "--delegates=47",
                "--blocktime=9",
                "--maxTxPerBlock=122",
                "--maxBlockPayload=123444",
                "--rewardHeight=23000",
                "--rewardAmount=66000",
                "--pubKeyHash=168",
                "--wif=27",
                "--token=myn",
                "--symbol=my",
                "--explorer=myex.io",
            ]),
        ).rejects.toThrow(`${configCrypto} already exists.`);

        existsSync.mockReset();
    });

    it("should throw if some properties are not provided", async () => {
        prompts.inject([
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
        ]);

        await expect(GenerateCommand.run([])).rejects.toThrow("Please provide all flags and try again!");
    });

    it("should throw if the properties are not confirmed", async () => {
        prompts.inject([
            "mynet7",
            "120000000000",
            "47",
            "9",
            "122",
            "123444",
            "23000",
            "66000",
            "168",
            "27",
            "myn",
            "my",
            "myex.io",
            false,
        ]);

        await expect(GenerateCommand.run([])).rejects.toThrow("You'll need to confirm the input to continue.");
    });

    it("should generate a new configuration if the properties are confirmed", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
        const copyFileSync = jest.spyOn(fs, "copyFileSync").mockImplementation();

        prompts.inject([
            "mynet7",
            "120000000000",
            "47",
            "9",
            "122",
            "123444",
            "23000",
            "66000",
            "168",
            "27",
            "myn",
            "my",
            "myex.io",
            true,
        ]);

        await GenerateCommand.run([]);

        expect(existsSync).toHaveBeenCalledWith(configCore);
        expect(existsSync).toHaveBeenCalledWith(configCrypto);

        expect(ensureDirSync).toHaveBeenCalledWith(configCore);
        expect(ensureDirSync).toHaveBeenCalledWith(configCrypto);

        expect(writeJSONSync).toHaveBeenCalledTimes(6); // 4x Core + 2x Crypto

        expect(writeFileSync).toHaveBeenCalled();
        expect(copyFileSync).toHaveBeenCalledTimes(2);

        existsSync.mockReset();
        ensureDirSync.mockReset();
        writeJSONSync.mockReset();
        writeFileSync.mockReset();
        copyFileSync.mockReset();
    });
});
