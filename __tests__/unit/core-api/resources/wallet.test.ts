import "jest-extended";
import { WalletResource } from "@packages/core-api/src/resources";

let resource: WalletResource;

beforeEach(() => {
    resource = new WalletResource();
});

describe("WalletResource", () => {
    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw({})).toEqual({});
        });
    });
});
