import "jest-extended";

import { ProcessState } from "@packages/core-cli/src/contracts";
import { Action } from "@packages/core-manager/src/actions/process-list";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework/src";

let sandbox: Sandbox;
let action: Action;

let mockCli;

beforeEach(() => {
    mockCli = {
        get: jest.fn().mockReturnValue({
            list: jest.fn().mockReturnValue([
                {
                    pid: 13477,
                    name: "ark-manager",
                    pm_id: 0,
                    pm2_env: {},
                    monit: {
                        memory: 98283520,
                        cpu: 0.1,
                    },
                },
            ]),
            status: jest.fn().mockReturnValue(ProcessState.Online),
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

describe("Process:List", () => {
    it("should have name", () => {
        expect(action.name).toEqual("process.list");
    });

    it("should return process list", async () => {
        const promise = action.execute({});

        await expect(promise).toResolve();

        const result = await promise;

        expect(result).toEqual([
            {
                pid: 13477,
                name: "ark-manager",
                pm_id: 0,
                monit: {
                    memory: 95980,
                    cpu: 0.1,
                },
                status: "online",
            },
        ]);
    });
});
