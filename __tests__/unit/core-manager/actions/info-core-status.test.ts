import "jest-extended";

import { ProcessState } from "@packages/core-cli/src/contracts";
import { Action } from "@packages/core-manager/src/actions/info-core-status";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { HttpClient } from "@packages/core-manager/src/utils";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

let mockCli;

beforeEach(() => {
    mockCli = {
        get: jest.fn().mockReturnValue({
            status: jest.fn().mockReturnValue(ProcessState.Online),
        }),
    };

    HttpClient.prototype.get = jest.fn().mockReturnValue({
        data: {
            syncing: true,
        },
    });

    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.CLI).toConstantValue(mockCli);

    action = sandbox.app.resolve(Action);
});

afterEach(() => {
    delete process.env.CORE_API_DISABLED;
    jest.clearAllMocks();
});

describe("Info:CoreStatus", () => {
    it("should have name", () => {
        expect(action.name).toEqual("info.coreStatus");
    });

    it("should return status and syncing using HTTP", async () => {
        const promise = action.execute({});

        await expect(promise).toResolve();

        const result = await promise;

        expect(result).toEqual({ processStatus: "online", syncing: true });
    });

    it("should return status and syncing using HTTPS", async () => {
        process.env.CORE_API_DISABLED = "true";

        const promise = action.execute({});

        await expect(promise).toResolve();

        const result = await promise;

        expect(result).toEqual({ processStatus: "online", syncing: true });
    });

    it("should return syncing = false if error on request", async () => {
        HttpClient.prototype.get = jest.fn().mockImplementation(async () => {
            throw new Error();
        });

        const promise = action.execute({});

        await expect(promise).toResolve();

        const result = await promise;

        expect(result).toEqual({ processStatus: "online", syncing: undefined });
    });

    it("should return status undefined if process status is undefined", async () => {
        mockCli.get = jest.fn().mockReturnValue({
            status: jest.fn().mockReturnValue(undefined),
        });

        const promise = action.execute({});

        await expect(promise).toResolve();

        const result = await promise;

        expect(result).toEqual({ processStatus: "undefined", syncing: true });
    });
});
