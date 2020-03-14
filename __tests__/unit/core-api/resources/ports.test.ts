import "jest-extended";
import { PortsResource } from "@packages/core-api/src/resources";

let resource: PortsResource;

beforeEach(() => {
    resource = new PortsResource();
});

describe("PortsResource", () => {
    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw({})).toEqual({});
        });
    });
});
