import "jest-extended";

import { DelegateResource } from "@packages/core-api/src/resources";

let resource: DelegateResource;

beforeEach(() => {
    resource = new DelegateResource();
});

describe("DelegateResource", () => {
    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw({})).toEqual({});
        });
    });
});
