import "jest-extended";

import { getCoreOrForgerProcessName, getOnlineProcesses } from "@packages/core-manager/src/utils";

let processManager;
const processes = [{ name: "ark-core" }, { name: "ark-forger" }, { name: "ark-relay" }];

beforeEach(() => {
    processManager = {
        list: jest.fn().mockReturnValue(processes),
        isOnline: jest.fn().mockReturnValue(true),
    };
});

describe("getOnlineProcesses", () => {
    it("should filter online processes", async () => {
        expect(getOnlineProcesses(processManager)).toEqual(processes);
    });
});

describe("getCoreOrForgerProcessName", () => {
    it("should return ark-core", async () => {
        expect(getCoreOrForgerProcessName(processes)).toEqual("ark-core");
    });

    it("should throw error if ark-core or ark-forger is not online process", async () => {
        expect(() => {
            getCoreOrForgerProcessName([]);
        }).toThrowError("Process with name ark-forger or ark-core is not online");
    });
});
