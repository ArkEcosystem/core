import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/info-resources";
import { Sandbox } from "@packages/core-test-framework";
import si from "systeminformation";

const dfDiskData = {
    filesystem: "/dev/disk1s1",
    size: 499963174912,
    used: 11138412544,
    available: 264768466944,
    capacity: 0.05,
    mountpoint: "/",
};

const diskData = {
    fs: "/dev/disk1s1",
    size: 499963174912,
    used: 11138412544,
    mount: "/",
};

jest.mock("@sindresorhus/df", () => {
    const df = async function () {
        return [dfDiskData];
    };

    df.file = async () => {
        return dfDiskData;
    };

    return df;
});

si.fsSize = jest.fn().mockResolvedValue([diskData]);

let sandbox: Sandbox;
let action: Action;

beforeEach(() => {
    sandbox = new Sandbox();

    action = sandbox.app.resolve(Action);
});

describe("Info:Resources", () => {
    it("should have name", () => {
        expect(action.name).toEqual("info.resources");
    });

    it("should return cpu, mem, filesystem data", async () => {
        const result = await action.execute({});

        expect(result.cpu.total).toEqual(100);
        expect(result.cpu.total - (result.cpu.used + result.cpu.available)).toEqual(0);

        expect(typeof result.ram.total).toEqual("number");
        expect(result.ram.total - (result.ram.used + result.ram.available)).toEqual(0);

        expect(typeof result.disk.mountpoint).toEqual("string");
        expect(typeof result.disk.filesystem).toEqual("string");
        expect(typeof result.disk.total).toEqual("number");
        expect(result.disk.total - (result.disk.used + result.disk.available)).toEqual(0);
    });
});
