import "jest-extended";

import { LockResource } from "@packages/core-api/src/resources";
import { Utils } from "@packages/crypto/src";

let resource: LockResource;

beforeEach(() => {
    resource = new LockResource();
});

describe("DelegateResource", () => {
    let lock: any;

    beforeEach(() => {
        lock = {
            amount: Utils.BigNumber.make("100"),
            timestamp: 2,
        };
    });

    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw(lock)).toEqual(lock);
        });
    });

    describe("transformed", () => {
        it("should return transformed object", async () => {
            expect(resource.transform(lock)).toEqual({
                ...lock,
                amount: "100",
                timestamp: {
                    epoch: 2,
                    human: "2017-03-21T13:00:02.000Z",
                    unix: 1490101202,
                },
            });
        });
    });
});
