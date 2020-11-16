import { ProcessBlockAction } from "@packages/core-blockchain/src/actions/process-block";

const blockProcessor = {
    process: jest.fn(),
};

const block = {
    id: "dummy_block_id",
};

describe("ProcessBlockAction", () => {
    it("should execute", async () => {
        const action = new ProcessBlockAction();

        await action.execute({ blockProcessor, block });

        expect(blockProcessor.process).toHaveBeenCalledWith(block);
    });
});
