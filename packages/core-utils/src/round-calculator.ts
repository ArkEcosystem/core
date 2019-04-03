import { app } from "@arkecosystem/core-container";

/**
 * Calculate the round and nextRound based on the height and active delegates.
 * @param  {Number} height
 * @param  {Number} maxDelegates
 * @return {Object}
 */
export const calculateRound = (
    height: number,
    maxDelegates?: number,
): { round: number; nextRound: number; maxDelegates: number } => {
    const config = app.getConfig();
    maxDelegates = maxDelegates || config.getMilestone(height).activeDelegates;

    const round = Math.floor((height - 1) / maxDelegates) + 1;
    const nextRound = Math.floor(height / maxDelegates) + 1;

    return { round, nextRound, maxDelegates };
};

/**
 * Detect if height is the beginning of a new round.
 * @param  {Number} height
 * @return {boolean} true if new round, false if not
 */
export const isNewRound = (height: number): boolean => {
    const config = app.getConfig();
    const maxDelegates = config.getMilestone(height).activeDelegates;

    return height % maxDelegates === 1;
};
