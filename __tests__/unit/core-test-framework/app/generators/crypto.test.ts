import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { CryptoConfigPaths, SandboxOptions } from "@packages/core-test-framework/src";
import { CryptoGenerator } from "@packages/core-test-framework/src/app/generators/crypto";
import { PathLike } from "fs";
import fsExtra from "fs-extra";

import { sandboxOptions } from "./__fixtures__/assets";

afterEach(() => {
    jest.resetAllMocks();
});

describe("CryptoGenerator", () => {
    it("should generate crypto config paths", async () => {
        const generator: CryptoGenerator = new CryptoGenerator();

        const result: CryptoConfigPaths = generator.generate();

        expect(result.root).toBeString();
        expect(result.exceptions).toBeString();
        expect(result.genesisBlock).toBeString();
        expect(result.milestones).toBeString();
        expect(result.network).toBeString();
    });

    it("should generate crypto config paths with options", async () => {
        const generator: CryptoGenerator = new CryptoGenerator(sandboxOptions);

        const result: CryptoConfigPaths = generator.generate();

        expect(result.root).toBeString();
        expect(result.exceptions).toBeString();
        expect(result.genesisBlock).toBeString();
        expect(result.milestones).toBeString();
        expect(result.network).toBeString();
    });

    it("should generate crypto config paths without specific cryptoManager config being set", async () => {
        const options: SandboxOptions = JSON.parse(JSON.stringify(sandboxOptions));

        options.crypto.flags.distribute = false;

        const generator: CryptoGenerator = new CryptoGenerator(options);

        const result: CryptoConfigPaths = generator.generate();

        expect(result.root).toBeString();
        expect(result.exceptions).toBeString();
        expect(result.genesisBlock).toBeString();
        expect(result.milestones).toBeString();
        expect(result.network).toBeString();
    });

    it("should generate crypto config paths with specific cryptoManager config being set", async () => {
        const options: SandboxOptions = JSON.parse(JSON.stringify(sandboxOptions));

        options.crypto.flags.distribute = false;
        options.crypto.flags.pubKeyHash = 22;
        options.crypto.cryptoManager = CryptoSuite.CryptoManager.createFromPreset("devnet");

        const generator: CryptoGenerator = new CryptoGenerator(options);

        const result: CryptoConfigPaths = generator.generate();

        expect(result.root).toBeString();
        expect(result.exceptions).toBeString();
        expect(result.genesisBlock).toBeString();
        expect(result.milestones).toBeString();
        expect(result.network).toBeString();
    });

    it("should throw error if destination already exist", async () => {
        jest.spyOn(fsExtra, "existsSync").mockImplementation((path: PathLike): boolean => {
            return true;
        });

        const generator: CryptoGenerator = new CryptoGenerator();

        expect(() => {
            generator.generate();
        }).toThrowError();
    });
});
