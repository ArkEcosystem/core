import "jest-extended";

import { RoundResource } from "@packages/core-api/src/resources";

let resource: RoundResource;

beforeEach(() => {
    resource = new RoundResource();
});

describe("RoundResource", () => {
    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw({})).toEqual({});
        });
    });
});
