import "jest-extended";

import fsExtra from "fs-extra";
import { PathLike } from "fs";
import { CoreGenerator } from "@packages/core-test-framework/src/app/generators/core";
import { CoreConfigPaths } from "@packages/core-test-framework/src";
import { sandboxOptions } from "./__fixtures__/assets";

afterEach(() => {
    jest.resetAllMocks();
});

describe("CoreGenerator", () => {
    it("should generate core config paths", async () => {
        let generator: CoreGenerator = new CoreGenerator();

        let result: CoreConfigPaths = generator.generate();

        expect(result.root).toBeString();
        expect(result.env).toBeString();
        expect(result.app).toBeString();
        expect(result.delegates).toBeString();
        expect(result.peers).toBeString();
    });

    it("should generate core config paths with options", async () => {
        let generator: CoreGenerator = new CoreGenerator(sandboxOptions);

        let result: CoreConfigPaths = generator.generate();

        expect(result.root).toBeString();
        expect(result.env).toBeString();
        expect(result.app).toBeString();
        expect(result.delegates).toBeString();
        expect(result.peers).toBeString();
    });

    it("should throw error if destination already exist", async () => {
        jest.spyOn(fsExtra, "existsSync").mockImplementation((path: PathLike): boolean => {
            return true;
        });

        let generator: CoreGenerator = new CoreGenerator();

        expect(() => {
            generator.generate();
        }).toThrowError();
    });
});
