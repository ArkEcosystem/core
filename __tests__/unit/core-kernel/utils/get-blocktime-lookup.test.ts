import "jest-extended";

import { Application } from "@packages/core-kernel";
import { getBlockTimeLookup } from "@packages/core-kernel/src/utils/get-blocktime-lookup";
import { Managers } from "@packages/crypto";
import { configManager } from "@packages/crypto/src/managers";
import { devnet } from "@packages/crypto/src/networks";

afterEach(() => jest.clearAllMocks());

const milestones = [
    { height: 1, blocktime: 5 },
    { height: 3, blocktime: 4 },
    { height: 5, blocktime: 6 },
];

const mockApp: Application = {
    // @ts-ignore
    get: () => {
        return {
            findBlockByHeights: async (heights: Array<number>): Promise<Array<any>> => {
                const result = [{ timestamp: 0 }];
                switch (heights[0]) {
                    case 2:
                        result[0].timestamp = 5;
                        return result;
                    case 4:
                        result[0].timestamp = 14;
                        return result;
                    default:
                        throw new Error(`Test scenarios should not hit this line`);
                }
            },
        };
    },
};

beforeEach(() => {
    const config = { ...devnet, milestones };
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);
});

describe("getBlockTimeLookup", () => {
    it("should return a method to lookup blockTimestamps via a given height", async () => {
        await expect(getBlockTimeLookup(mockApp, 1)).resolves.toBeFunction();
        await expect(getBlockTimeLookup(mockApp, 2)).resolves.toBeFunction();
        await expect(getBlockTimeLookup(mockApp, 3)).resolves.toBeFunction();
        await expect(getBlockTimeLookup(mockApp, 4)).resolves.toBeFunction();
        await expect(getBlockTimeLookup(mockApp, 5)).resolves.toBeFunction();
        await expect(getBlockTimeLookup(mockApp, 6)).resolves.toBeFunction();
    });

    it("should return a function that retrieves correct values when searching a height before a milestone change", async () => {
        const lookupResultOne = await getBlockTimeLookup(mockApp, 1);
        const lookupResultTwo = await getBlockTimeLookup(mockApp, 3);
        const lookupResultThree = await getBlockTimeLookup(mockApp, 5);

        expect(lookupResultOne(1)).toEqual(0);
        expect(lookupResultTwo(2)).toEqual(5);
        expect(lookupResultThree(4)).toEqual(14);
    });

    it("returned function should be able to look up any height before any milestone below current height", async () => {
        const lookupResultOne = await getBlockTimeLookup(mockApp, 1);
        const lookupResultTwo = await getBlockTimeLookup(mockApp, 3);
        const lookupResultThree = await getBlockTimeLookup(mockApp, 5);

        expect(lookupResultOne(1)).toEqual(0);

        expect(lookupResultTwo(1)).toEqual(0);
        expect(lookupResultTwo(2)).toEqual(5);

        expect(lookupResultThree(1)).toEqual(0);
        expect(lookupResultThree(2)).toEqual(5);
        expect(lookupResultThree(4)).toEqual(14);
    });

    it("returned function should throw when not looking up a block before a milestone change", async () => {
        const lookupResultOne = await getBlockTimeLookup(mockApp, 1);
        const lookupResultTwo = await getBlockTimeLookup(mockApp, 3);
        const lookupResultThree = await getBlockTimeLookup(mockApp, 5);

        const generateErrorMessage = (height: number) =>
            `Attempted lookup of block height ${height} for milestone span calculation, but none exists.`;

        expect(() => lookupResultOne(3)).toThrow(generateErrorMessage(3));
        expect(() => lookupResultTwo(5)).toThrow(generateErrorMessage(5));
        expect(() => lookupResultTwo(6)).toThrow(generateErrorMessage(6));
        expect(() => lookupResultThree(6)).toThrow(generateErrorMessage(6));
    });
});
