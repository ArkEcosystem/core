import "jest-extended";

import { ProcessState } from "@packages/core-cli/src/contracts";
import { Action } from "@packages/core-manager/src/actions/process-list";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

let mockCli;
let mockProcessManagerListItem;
let mockProcessManagerStatus;

beforeEach(() => {
    mockProcessManagerListItem = {
        pid: 13477,
        name: "ark-manager",
        pm_id: 0,
        pm2_env: {},
        monit: {
            memory: 98283520,
            cpu: 0.1,
        },
    };

    mockProcessManagerStatus = ProcessState.Online;

    mockCli = {
        get: jest.fn().mockReturnValue({
            list: jest.fn().mockReturnValue([mockProcessManagerListItem]),
            status: jest.fn().mockImplementation(() => {
                return mockProcessManagerStatus;
            }),
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

    it("should return status undefined if status cant be defined", async () => {
        mockProcessManagerStatus = undefined;

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
                status: "undefined",
            },
        ]);
    });
});
