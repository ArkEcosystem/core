import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/info-resources";
import { Sandbox } from "@packages/core-test-framework";

const diskData = {
    filesystem: "/dev/disk1s1",
    size: 499963174912,
    used: 11138412544,
    available: 264768466944,
    capacity: 0.05,
    mountpoint: "/",
};

jest.mock("@sindresorhus/df", () => {
    const df = async function () {
        return [diskData];
    };

    df.file = async () => {
        return diskData;
    };

    return df;
});

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

        expect(result.disks.length).toBeGreaterThan(1);
        result.disks.forEach((fs) => {
            expect(typeof fs.mountpoint).toEqual("string");
            expect(typeof fs.filesystem).toEqual("string");
            expect(typeof fs.total).toEqual("number");
            expect(fs.total - (fs.used + fs.available)).toEqual(0);
        });

        expect(result.installationDisk).toEqual("/dev/disk1s1");
    });
});
