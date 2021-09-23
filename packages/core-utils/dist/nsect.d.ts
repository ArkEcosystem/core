declare type ProbeCallback = (indexesToProbe: number[]) => Promise<number>;
/**
 * Perform an N-ary (e.g. binary search for N=2) on a given sorted sequence of elements.
 * It would find the first (lowest) element that matches according to a provided probe function.
 */
export declare class NSect {
    private readonly nAry;
    private readonly probe;
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
    constructor(nAry: number, probe: ProbeCallback);
    /**
     * Find the first (lowest) element satisfying a condition as defined by the probe function
     * in a range [low, high].
     * @param {Number} low lowest interval boundary (inclusive)
     * @param {Number} high highest interval boundary (inclusive)
     * @return {Number} the index of the first (lowest) element that satisfies the condition
     */
    find(low: number, high: number): Promise<number>;
    /**
     * Given an interval [low, high], split it in `nAry` intervals and return those intervals'
     * boundaries.
     * For example (assuming `nAry` is 8):
     * [1, 81] -> [1, 11, 21, 31, 41, 51, 61, 71, 81]
     * @param {Number} low lower boundary of the interval to split
     * @param {Number} high higher boundary of the interval to split
     * @return {Array} intervals' boundaries
     */
    private calcProbes;
}
export {};
