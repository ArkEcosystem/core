import "jest-extended";

import { FeeStatisticsResource } from "@packages/core-api/src/resources";

// TODO: Use from support or add to node code
type FeeStatistics = {
    type: number;
    typeGroup: number;
    avgFee: string;
    minFee: string;
    maxFee: string;
    sum: string;
};

let resource: FeeStatisticsResource;

beforeEach(() => {
    resource = new FeeStatisticsResource();
});

describe("DelegateResource", () => {
    let feeStatistics: FeeStatistics;

    beforeEach(() => {
        feeStatistics = {
            type: 1,
            typeGroup: 1,
            avgFee: "15",
            minFee: "10",
            maxFee: "20",
            sum: "200",
        };
    });

    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw(feeStatistics)).toEqual(feeStatistics);
        });
    });

    describe("transformed", () => {
        it("should return transformed object", async () => {
            expect(resource.transform(feeStatistics)).toEqual({
                type: 1,
                fees: {
                    minFee: 10,
                    maxFee: 20,
                    avgFee: 15,
                },
            });
        });
    });
});
