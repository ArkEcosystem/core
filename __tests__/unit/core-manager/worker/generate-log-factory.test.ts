import "jest-extended";

import { generateLogFactory } from "@packages/core-manager/src/workers/generate-log-factory";
import { GenerateLogZip } from "@packages/core-manager/src/workers/generate-log-zip";
import { GenerateLogGz } from "@packages/core-manager/src/workers/generate-log-gz";

jest.mock("@packages/core-manager/src/workers/generate-log-zip");
jest.mock("@packages/core-manager/src/workers/generate-log-gz");

describe("Generate Log Factory", () => {
    it("should return instance of GenerateLogZip", async () => {
        expect(
            // @ts-ignore
            generateLogFactory({
                archiveFormat: "zip",
            }),
        ).toBeInstanceOf(GenerateLogZip);
    });

    it("should return instance of GenerateLogGz", async () => {
        expect(
            // @ts-ignore
            generateLogFactory({
                archiveFormat: "gz",
            }),
        ).toBeInstanceOf(GenerateLogGz);
    });
});
