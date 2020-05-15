import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/info-disk-space";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

const singleDiskData = {
    filesystem: "/dev/disk1s1",
    size: 499963174912,
    used: 11138412544,
    available: 264768466944,
    capacity: 0.05,
    mountpoint: "/",
};

jest.mock("@sindresorhus/df", () => {
    const df = async function () {
        return [singleDiskData, singleDiskData];
    };

    df.file = async () => {
        return [singleDiskData];
    };

    return df;
});

beforeEach(() => {
    sandbox = new Sandbox();

    action = sandbox.app.resolve(Action);
});

describe("Info:DiskSpace", () => {
    it("should have name", () => {
        expect(action.name).toEqual("info.diskSpace");
    });

    it("should return single disk space", async () => {
        const result = await action.execute({});

        expect(result).toBeArray();
        expect(result.length).toBe(1);
    });

    it("should return all disk space", async () => {
        const result = await action.execute({ showAllDisks: true });

        expect(result).toBeArray();
        expect(result.length).toBeGreaterThan(1);
    });
});
