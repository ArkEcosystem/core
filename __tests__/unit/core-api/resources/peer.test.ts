import "jest-extended";
import { PeerResource } from "@packages/core-api/src/resources";

let resource: PeerResource;

beforeEach(() => {
    resource = new PeerResource();
});

describe("PeerResource", () => {
    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw({})).toEqual({});
        });
    });
});
