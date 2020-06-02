import "jest-extended";

import { Container } from "@arkecosystem/core-kernel";
import { Sandbox } from "@arkecosystem/core-test-framework/src";
import { NextSlotProcessAction } from "@packages/core-forger/src/process-actions/next-slot";

let sandbox: Sandbox;
let action: NextSlotProcessAction;

const mockForgerService = {
    getRemainingSlotTime: jest.fn().mockReturnValue(1000),
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.ForgerService).toConstantValue(mockForgerService);

    action = sandbox.app.resolve(NextSlotProcessAction);
});

describe("NextSlotProcessAction", () => {
    it("should return remaining time", async () => {
        await expect(action.handler()).resolves.toEqual({
            remainingTime: 1000,
        });
    });
});
