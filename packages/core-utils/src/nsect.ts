import assert from "assert";

type ProbeCallback = (indexesToProbe: number[]) => Promise<number>;

/**
 * Perform an N-ary (e.g. binary search for N=2) on a given sorted sequence of elements.
 * It would find the first (lowest) element that matches according to a provided probe function.
 */
export class NSect {
    /**
     * Constructor.
     * @param {Number} nAry type of search to perform.
     * @param {Function} probe a probe callback function, it will be passed an array
     * of indexes, in ascending order, always with length nAry + 1 and it should return one of those
     * indexes, the last (highest) that matches the search criteria. For the algorithm to work the
     * sequence must be sorted - all elements that are lower than some must match and all elements
     * higher than that one must not match. This probe function will be called logA(sequence length)
     * times, where A, the base of the logarithm is equal to nAry.
     */
    constructor(private readonly nAry: number, private readonly probe: ProbeCallback) {}

    /**
     * Find the first (lowest) element satisfying a condition as defined by the probe function
     * in a range [low, high].
     * @param {Number} low lowest interval boundary (inclusive)
     * @param {Number} high highest interval boundary (inclusive)
     * @return {Number} the index of the first (lowest) element that satisfies the condition
     */
    public async find(low: number, high: number): Promise<number> {
        let highestMatching: number;

        for (;;) {
            const indexesToProbe: number[] = this.calcProbes(low, high);

            const temp: number = await this.probe(indexesToProbe);

            if (temp === undefined) {
                break;
            }

            highestMatching = temp;

            if (low + this.nAry >= high) {
                // The range is narrowed so much that we probed every element in the range.
                // No need to narrow further - highestMatching contains the definitive result.
                break;
            }

            // If we probed for elements at heights, for example: 1000, 1100, 1200, 1300
            // and the probe returned that the highest matching is at:
            // A. 1300 (the highest we probed for), then we end the search and highestMatching
            //    contains the definitive result. One of the two happened:
            //    a. this is the first iteration of the loop and all elements in the sequence match, or
            //    b. this is the 2+ iteration and on the previous iteration the probe returned
            //       that 1301 is not a match (otherwise we wouldn't be probing [1000, 1300]).
            // B. 1100 (anything other than the highest), then this implies that the element
            //    at 1200 is not a match. So in the next iteration we probe for elements between
            //    1101 and 1199.

            // Case A.
            if (highestMatching === indexesToProbe[indexesToProbe.length - 1]) {
                break;
            }

            // Case B. From the example above, we have:
            // highestMatching = 1100
            // indexesToProbe[0] = 1000, is a match
            // indexesToProbe[1] = 1100, is a match
            // indexesToProbe[2] = 1200, is not a match
            // indexesToProbe[3] = 1300, is not a match
            // we will get indexOfHighestMatching = 1, and for the next iteration:
            // low = 1100 + 1 = 1101
            // high = indexesToProbe[1 + 1] - 1 = indexesToProbe[2] - 1 = 1200 - 1 = 1199
            const indexOfHighestMatching: number = indexesToProbe.indexOf(highestMatching);
            assert.notStrictEqual(indexOfHighestMatching, -1);
            assert(indexOfHighestMatching < indexesToProbe.length - 1);

            if (indexesToProbe[indexOfHighestMatching] + 1 === indexesToProbe[indexOfHighestMatching + 1]) {
                // In a narrow range, it may happen that:
                // highestMatching = 1100
                // indexesToProbe[0] = 1099, is a match
                // indexesToProbe[1] = 1100, is a match
                // indexesToProbe[2] = 1101, is not a match
                // indexesToProbe[3] = 1103, is not a match
                // indexOfHighestMatching = 1
                // Then we know highestMatching is the definitive result because the probe
                // declared that the data at index 1100 matches and the data at index 1101
                // does not match.
                break;
            }

            low = highestMatching + 1;
            high = indexesToProbe[indexOfHighestMatching + 1] - 1;
        }

        return highestMatching;
    }

    /**
     * Given an interval [low, high], split it in `nAry` intervals and return those intervals'
     * boundaries.
     * For example (assuming `nAry` is 8):
     * [1, 81] -> [1, 11, 21, 31, 41, 51, 61, 71, 81]
     * @param {Number} low lower boundary of the interval to split
     * @param {Number} high higher boundary of the interval to split
     * @return {Array} intervals' boundaries
     */
    private calcProbes(low: number, high: number): number[] {
        assert(low <= high, `${low} <= ${high}`);
        const diff: number = high - low;
        const p: Set<number> = new Set<number>();

        for (let i = 0; i < this.nAry + 1; i++) {
            const h: number = low + Math.round((diff * i) / this.nAry);
            p.add(h);
        }

        return Array.from(p);
    }
}
