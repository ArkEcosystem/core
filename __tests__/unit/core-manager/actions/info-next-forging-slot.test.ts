import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/info-next-forging-slot";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework";

import { TriggerResponses } from "../__fixtures__";

let sandbox: Sandbox;
let action: Action;

let mockCli;
let mockTrigger;

beforeEach(() => {
    mockTrigger = jest.fn().mockReturnValue({
        stdout: TriggerResponses.forgetNextForgingSlotResponse,
    });

    mockCli = {
        get: jest.fn().mockReturnValue({
            trigger: mockTrigger,
        }),
    };

    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.CLI).toConstantValue(mockCli);

    action = sandbox.app.resolve(Action);
});

afterEach(() => {
    delete process.env.CORE_API_DISABLED;
    jest.clearAllMocks();
});

describe("Info:NextForgingSlot", () => {
    it("should have name", () => {
        expect(action.name).toEqual("info.nextForgingSlot");
    });

    it("should return remainingTime", async () => {
        const result = await action.execute({});

        expect(result).toEqual({ remainingTime: 6000 });
    });

    it("should throw error if trigger responded with error", async () => {
        mockTrigger = jest.fn().mockReturnValue({
            stdout: TriggerResponses.forgetNextForgingSlotError,
        });

        mockCli.get = jest.fn().mockReturnValue({
            trigger: mockTrigger,
        });

        await expect(action.execute({})).rejects.toThrow("Trigger returned error");
    });
});
