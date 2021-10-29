import "jest-extended";

import { TransactionPoolProcessor } from "@packages/core-test-framework/src/mocks";

let processorState = {
    accept: ["f0880e972206698bf48e43325ec03045a3b2ab215b8f716a51742a909b718177"],
    broadcast: ["f0880e972206698bf48e43325ec03045a3b2ab215b8f716a51742a909b718177"],
    invalid: ["9f912ac02c06f6afc7ad80eca355ae5a31d175207885359a06da5a618dcdaa58"],
    excess: ["e875dc95e9e404ba7ba93dd92f6c9190bc87d244fce8db3046d64705ce4680f9"],
    errors: {
        "0c79fe9faf214de92847baa322a9e991a49f6f6f0bc774927098c7feae627d77": {
            type: "dummy error type",
            message: "dummy error message",
        },
    },
};

const clear = () => {
    TransactionPoolProcessor.setProcessorState({});
};

describe("TransactionPoolProcessor", () => {
    describe("default values", () => {
        it("accept should be empty array", async () => {
            expect((await TransactionPoolProcessor.instance.process([])).accept).toEqual([]);
        });

        it("broadcast should be empty array", async () => {
            expect((await TransactionPoolProcessor.instance.process([])).broadcast).toEqual([]);
        });

        it("invalid should be empty array", async () => {
            expect((await TransactionPoolProcessor.instance.process([])).invalid).toEqual([]);
        });

        it("excess should be empty array", async () => {
            expect((await TransactionPoolProcessor.instance.process([])).excess).toEqual([]);
        });

        it("errors should be empty array", async () => {
            expect((await TransactionPoolProcessor.instance.process([])).errors).toBeUndefined();
        });
    });

    describe("setProcessorState", () => {
        beforeEach(() => {
            clear();

            TransactionPoolProcessor.setProcessorState(processorState);
        });

        it("accept should be mocked value", async () => {
            expect((await TransactionPoolProcessor.instance.process([])).accept).toEqual(processorState.accept);
        });

        it("broadcast should be mocked value", async () => {
            expect((await TransactionPoolProcessor.instance.process([])).accept).toEqual(processorState.accept);
        });

        it("invalid should be mocked value", async () => {
            expect((await TransactionPoolProcessor.instance.process([])).invalid).toEqual(processorState.invalid);
        });

        it("excess should be mocked value", async () => {
            expect((await TransactionPoolProcessor.instance.process([])).excess).toEqual(processorState.excess);
        });

        it("errors should be mocked value", async () => {
            expect((await TransactionPoolProcessor.instance.process([])).errors).toEqual(processorState.errors);
        });
    });

    describe("other", () => {
        beforeEach(() => {
            clear();
        });

        it("process method should resolve", async () => {
            await expect(TransactionPoolProcessor.instance.process([])).toResolve();
        });
    });
});
