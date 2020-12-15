import { GenerateLog } from "@packages/core-manager/src/workers/actions/generate-log";

jest.mock("@packages/core-manager/src/workers/actions/generate-log");

describe("Worker", () => {
    it("should call generate log action", async () => {
        require("@packages/core-manager/src/workers/worker");

        expect(GenerateLog.prototype.execute).toHaveBeenCalled();
    });
});
