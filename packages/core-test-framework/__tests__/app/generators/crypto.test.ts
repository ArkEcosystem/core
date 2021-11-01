import "jest-extended";

import fsExtra from "fs-extra";
import { PathLike } from "fs";
import { CryptoGenerator } from "@packages/core-test-framework/src/app/generators/crypto";
import { CryptoConfigPaths, SandboxOptions } from "@packages/core-test-framework/src";
import { sandboxOptions } from "./__fixtures__/assets";

afterEach(() => {
    jest.resetAllMocks();
});

describe("CryptoGenerator", () => {
    it("should generate crypto config paths", async () => {
        let generator: CryptoGenerator = new CryptoGenerator();

        let result: CryptoConfigPaths = generator.generate();

        expect(result.root).toBeString();
        expect(result.exceptions).toBeString();
        expect(result.genesisBlock).toBeString();
        expect(result.milestones).toBeString();
        expect(result.network).toBeString();
    });

    it("should generate crypto config paths with options", async () => {
        let generator: CryptoGenerator = new CryptoGenerator(sandboxOptions);

        let result: CryptoConfigPaths = generator.generate();

        expect(result.root).toBeString();
        expect(result.exceptions).toBeString();
        expect(result.genesisBlock).toBeString();
        expect(result.milestones).toBeString();
        expect(result.network).toBeString();
    });

    it("should generate crypto config paths without genesis block", async () => {
        let options: SandboxOptions = JSON.parse(JSON.stringify(sandboxOptions));

        options.crypto.flags.distribute = false;
        delete options.crypto.genesisBlock;

        let generator: CryptoGenerator = new CryptoGenerator(options);

        let result: CryptoConfigPaths = generator.generate();

        expect(result.root).toBeString();
        expect(result.exceptions).toBeString();
        expect(result.genesisBlock).toBeString();
        expect(result.milestones).toBeString();
        expect(result.network).toBeString();
    });

    // TODO: Test
    it("should generate crypto config paths without genesis block", async () => {
        let options: SandboxOptions = JSON.parse(JSON.stringify(sandboxOptions));

        options.crypto.flags.distribute = false;
        options.crypto.flags.pubKeyHash = 22;
        delete options.crypto.genesisBlock;

        let generator: CryptoGenerator = new CryptoGenerator(options);

        let result: CryptoConfigPaths = generator.generate();

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

        let generator: CryptoGenerator = new CryptoGenerator();

        expect(() => {
            generator.generate();
        }).toThrowError();
    });
});
