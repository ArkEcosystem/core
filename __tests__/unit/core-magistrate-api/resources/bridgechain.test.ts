import "jest-extended";
import { BridgechainResource } from "@packages/core-magistrate-api/src/resources";
import { IBridgechainRegistrationAsset } from "@packages/core-magistrate-crypto/src/interfaces";
import { Assets } from "../__fixtures__";

let resource: BridgechainResource;
let bridgechainRegistrationAsset: IBridgechainRegistrationAsset;

beforeEach(() => {
    resource = new BridgechainResource();

    bridgechainRegistrationAsset = Assets.bridgechainRegistrationAsset;
});

describe("BridgechainResource", () => {
    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw(bridgechainRegistrationAsset)).toEqual(bridgechainRegistrationAsset);
        });
    });

    describe("transform", () => {
        it("should return transformed object", async () => {
            expect(resource.transform(bridgechainRegistrationAsset)).toEqual(bridgechainRegistrationAsset);
        });
    });
});
