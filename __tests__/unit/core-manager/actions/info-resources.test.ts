import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/info-resources";
import { Sandbox } from "@packages/core-test-framework";

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

        expect(typeof result.mem.total).toEqual("number");
        expect(result.mem.total - (result.mem.used + result.mem.available)).toEqual(0);

        expect(result.filesystems.length).toBeGreaterThan(1);
        result.filesystems.forEach((fs) => {
            expect(typeof fs.mountpoint).toEqual("string");
            expect(typeof fs.filesystem).toEqual("string");
            expect(typeof fs.total).toEqual("number");
            expect(fs.total - (fs.used + fs.available)).toEqual(0);
        });
    });
});
