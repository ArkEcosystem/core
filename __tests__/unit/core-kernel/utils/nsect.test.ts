import "jest-extended";

import { NSect } from "@packages/core-kernel/src/utils/nsect";

let data: number[];
let nAry: number;
let numberOfProbeCalls: number;
let searchCondition: (element: number) => boolean;

async function probe(indexesToProbe: number[]): Promise<number> {
    numberOfProbeCalls++;

    // We must return the biggest index whose element satisfies the condition. So we probe
    // from the biggest to the smallest and the first one that satisfies the condition is
    // the one we report.
    for (let i = indexesToProbe.length - 1; i >= 0; i--) {
        const indexToProbe: number = indexesToProbe[i];

        if (searchCondition(data[indexToProbe])) {
            return indexToProbe;
        }
    }

    return undefined;
}

beforeAll(() => {
    data = [];
    for (let i = 0; i < 1000; i++) {
        data[i] = i * 10;
    }
});

describe("N-section (binary search)", () => {
    nAry = 2;

    const nSect = new NSect(nAry, probe);

    it("arbitrary", async () => {
        numberOfProbeCalls = 0;
    });
    it("lucky case", async () => {
        numberOfProbeCalls = 0;
        searchCondition = element => element <= 5000;
        expect(data[await nSect.find(0, data.length - 1)]).toBe(5000);
        expect(numberOfProbeCalls).toBe(2);
    });

    it("worst case", async () => {
        numberOfProbeCalls = 0;
        searchCondition = element => element <= 3560;
        expect(data[await nSect.find(0, data.length - 1)]).toBe(3560);
        expect(numberOfProbeCalls).toBe(9);
    });

    it("search in a sub-range", async () => {
        numberOfProbeCalls = 0;
        searchCondition = element => element <= 4000;
        expect(data[await nSect.find(350, 500)]).toBe(4000);
        expect(numberOfProbeCalls).toBe(6);
    });

    it("nonexistent", async () => {
        numberOfProbeCalls = 0;
        searchCondition = element => false;
        expect(await nSect.find(0, data.length - 1)).toBe(undefined);
        expect(numberOfProbeCalls).toBe(1);
    });

    it("biggest one", async () => {
        numberOfProbeCalls = 0;
        searchCondition = element => true;
        expect(data[await nSect.find(0, data.length - 1)]).toBe(9990);
        expect(numberOfProbeCalls).toBe(1);
    });
});

describe("N-section (8-ary search)", () => {
    nAry = 8;

    const nSect = new NSect(nAry, probe);

    it("arbitrary", async () => {
        numberOfProbeCalls = 0;
        searchCondition = element => element <= 5678;
        expect(data[await nSect.find(0, data.length - 1)]).toBe(5670);
        expect(numberOfProbeCalls).toBe(4);
    });

    it("lucky case", async () => {
        numberOfProbeCalls = 0;
        searchCondition = element => element <= 5000;
        expect(data[await nSect.find(0, data.length - 1)]).toBe(5000);
        expect(numberOfProbeCalls).toBe(2);
    });

    it("worst case", async () => {
        numberOfProbeCalls = 0;
        searchCondition = element => element <= 3560;
        expect(data[await nSect.find(0, data.length - 1)]).toBe(3560);
        expect(numberOfProbeCalls).toBe(4);
    });

    it("search in a sub-range", async () => {
        numberOfProbeCalls = 0;
        searchCondition = element => element <= 4000;
        expect(data[await nSect.find(350, 500)]).toBe(4000);
        expect(numberOfProbeCalls).toBe(3);
    });

    it("search in a narrow range", async () => {
        numberOfProbeCalls = 0;
        searchCondition = element => element <= 4000;
        expect(data[await nSect.find(398, 402)]).toBe(4000);
        expect(numberOfProbeCalls).toBe(1);
    });

    it("search in a range with length 9", async () => {
        numberOfProbeCalls = 0;
        searchCondition = element => element <= 4000;
        expect(data[await nSect.find(398, 407)]).toBe(4000);
        expect(numberOfProbeCalls).toBe(1);
    });

    it("nonexistent", async () => {
        numberOfProbeCalls = 0;
        searchCondition = element => false;
        expect(await nSect.find(0, data.length - 1)).toBe(undefined);
        expect(numberOfProbeCalls).toBe(1);
    });

    it("biggest one", async () => {
        numberOfProbeCalls = 0;
        searchCondition = element => true;
        expect(data[await nSect.find(0, data.length - 1)]).toBe(9990);
        expect(numberOfProbeCalls).toBe(1);
    });
});
