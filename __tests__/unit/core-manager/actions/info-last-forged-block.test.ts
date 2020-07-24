import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/info-last-forged-block";
import { Identifiers } from "@packages/core-manager/src/ioc";
import * as Utils from "@packages/core-manager/src/utils";
import { Sandbox } from "@packages/core-test-framework";

import { TriggerResponses } from "../__fixtures__";

let sandbox: Sandbox;
let action: Action;

let mockCli;
let mockTrigger;

beforeEach(() => {
    jest.spyOn(Utils, "getCoreOrForgerProcessName").mockReturnValue("ark-core");
    jest.spyOn(Utils, "getOnlineProcesses").mockReturnValue([]);

    mockTrigger = jest.fn().mockReturnValue({
        stdout: TriggerResponses.forgetLastForgedBlockResponse,
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

describe("Info:CurrentDelegate", () => {
    it("should have name", () => {
        expect(action.name).toEqual("info.lastForgedBlock");
    });

    it("should return last block", async () => {
        const result = await action.execute({});

        expect(result.data).toBeDefined();
        expect(result.serialized).toBeDefined();
    });

    it("should throw error if trigger responded with error", async () => {
        mockTrigger = jest.fn().mockReturnValue({
            stdout: TriggerResponses.forgetLastForgedBlockError,
        });

        mockCli.get = jest.fn().mockReturnValue({
            trigger: mockTrigger,
        });

        await expect(action.execute({})).rejects.toThrow("Trigger returned error");
    });
});
