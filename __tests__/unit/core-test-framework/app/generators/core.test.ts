import "jest-extended";

import { CoreConfigPaths } from "@packages/core-test-framework/src";
import { CoreGenerator } from "@packages/core-test-framework/src/app/generators/core";
import { PathLike } from "fs";
import fsExtra from "fs-extra";

import { sandboxOptions } from "./__fixtures__/assets";

afterEach(() => {
    jest.resetAllMocks();
});

describe("CoreGenerator", () => {
    it("should generate core config paths", async () => {
        const generator: CoreGenerator = new CoreGenerator();

        const result: CoreConfigPaths = generator.generate();

        expect(result.root).toBeString();
        expect(result.env).toBeString();
        expect(result.app).toBeString();
        expect(result.delegates).toBeString();
        expect(result.peers).toBeString();
    });

    it("should generate core config paths with options", async () => {
        const generator: CoreGenerator = new CoreGenerator(sandboxOptions);

        const result: CoreConfigPaths = generator.generate();

        expect(result.root).toBeString();
        expect(result.env).toBeString();
        expect(result.app).toBeString();
        expect(result.delegates).toBeString();
        expect(result.peers).toBeString();

        expect(fsExtra.readFileSync(result.env).toString()).toEqual("TEST=test\n");
        expect(fsExtra.readJSONSync(result.app)).toEqual({});
        expect(fsExtra.readJSONSync(result.delegates)).toEqual({});
        expect(fsExtra.readJSONSync(result.peers)).toEqual({});
    });

    it("should throw error if destination already exist", async () => {
        jest.spyOn(fsExtra, "existsSync").mockImplementation((path: PathLike): boolean => {
            return true;
        });

        const generator: CoreGenerator = new CoreGenerator();

        expect(() => {
            generator.generate();
        }).toThrowError();
    });
});
