import "jest-extended";

import { Container } from "@packages/core-kernel";
import { Sandbox } from "@packages/core-test-framework";
import { CurrentDelegateProcessAction } from "@packages/core-forger/src/process-actions/current-delegate";

let sandbox: Sandbox;
let action: CurrentDelegateProcessAction;

const mockForgerService = {
    getRound: jest.fn().mockReturnValue({
        currentForger: {
            delegate: {
                username: "dummy_username",
                rank: 10,
            },
        },
    }),
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.ForgerService).toConstantValue(mockForgerService);

    action = sandbox.app.resolve(CurrentDelegateProcessAction);
});

describe("CurrentDelegateRemoteAction", () => {
    it("should return delegate username and rank", async () => {
        await expect(action.handler()).resolves.toEqual({
            username: "dummy_username",
            rank: 10,
        });
    });
});
