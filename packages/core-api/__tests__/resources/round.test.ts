import "jest-extended";

import { Utils } from "@arkecosystem/core-kernel";
import { RoundResource } from "@packages/core-api/src/resources";

let resource: RoundResource;

const round = {
    publicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
    round: Utils.BigNumber.make("2"),
    balance: Utils.BigNumber.make("245100000000000"),
};

const roundTransformed = {
    publicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
    votes: "245100000000000",
};

beforeEach(() => {
    resource = new RoundResource();
});

describe("RoundResource", () => {
    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw(round)).toEqual(round);
        });
    });

    describe("transformed", () => {
        it("should return transformed object", async () => {
            expect(resource.transform(round)).toEqual(roundTransformed);
        });
    });
});
