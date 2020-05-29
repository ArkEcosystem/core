import "jest-extended";

import { LockResource } from "@packages/core-api/src/resources";
import { CryptoSuite } from "@packages/core-crypto";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));

let resource: LockResource;

beforeEach(() => {
    resource = new LockResource();
    // @ts-ignore
    resource.cryptoManager = crypto.CryptoManager;
});

describe("DelegateResource", () => {
    let lock: any;

    beforeEach(() => {
        lock = {
            amount: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("100"),
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
