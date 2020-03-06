import "jest-extended";
import { BusinessResource } from "@arkecosystem/core-magistrate-api/src/resources";
import { IBusinessRegistrationAsset } from "@arkecosystem/core-magistrate-crypto/src/interfaces";
import { Assets } from '../__fixtures__';

let resource: BusinessResource;
let businessRegistrationAsset: IBusinessRegistrationAsset;

beforeEach(() => {
    resource = new BusinessResource();

    businessRegistrationAsset = Assets.businessRegistrationAsset;
});

describe("BusinessResource", () => {
    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw(businessRegistrationAsset)).toEqual(businessRegistrationAsset);
        });
    });

    describe("transform", () => {
        it("should return transformed object", async () => {
            expect(resource.transform(businessRegistrationAsset)).toEqual(businessRegistrationAsset);
        });
    });
});
