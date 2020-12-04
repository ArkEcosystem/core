import "jest-extended";

import { Container } from "@arkecosystem/core-kernel";
import { Action } from "@packages/core-manager/src/actions/info-next-forging-slot";
import { Identifiers } from "@packages/core-manager/src/ioc";
import * as Utils from "@packages/core-manager/src/utils";
import { Sandbox } from "@packages/core-test-framework";

import { TriggerResponses } from "../__fixtures__";

let sandbox: Sandbox;
let action: Action;

let mockCli;
let mockTrigger;
let spyOnGetCoreOrForgerProcessName;

beforeEach(() => {
    spyOnGetCoreOrForgerProcessName = jest.spyOn(Utils, "getCoreOrForgerProcessName").mockReturnValue("ark-core");
    jest.spyOn(Utils, "getOnlineProcesses").mockReturnValue([]);

    mockTrigger = jest.fn().mockReturnValue({
        stdout: TriggerResponses.forgetNextForgingSlotResponse,
    });

    mockCli = {
        get: jest.fn().mockReturnValue({
            trigger: mockTrigger,
        }),
    };

    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.ApplicationToken).toConstantValue("ark");
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

        expect(spyOnGetCoreOrForgerProcessName).toHaveBeenCalledWith([], "ark");
    });

    it("should return remainingTime using token in params", async () => {
        const result = await action.execute({ token: "customToken" });

        expect(result).toEqual({ remainingTime: 6000 });

        expect(spyOnGetCoreOrForgerProcessName).toHaveBeenCalledWith([], "customToken");
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
