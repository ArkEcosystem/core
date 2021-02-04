import * as GenerateLogFactory from "@packages/core-manager/src/workers/generate-log-factory";

const mockGenerateLog = {
    execute: jest.fn(),
};
// @ts-ignore
GenerateLogFactory.generateLogFactory = jest.fn().mockReturnValue(mockGenerateLog);

describe("Worker", () => {
    it("should call generate log action", async () => {
        require("@packages/core-manager/src/workers/worker");

        expect(mockGenerateLog.execute).toHaveBeenCalled();
    });
});
