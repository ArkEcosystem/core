import { app } from "@arkecosystem/core-container";
import { dato } from "@faustbrian/dato";

/**
 * Format the given epoch based timestamp into human and unix.
 * @param  {Number} epochStamp
 * @return {Object}
 */
export function formatTimestamp(epochStamp) {
    const constants = app.getConfig().getMilestone(1);
    // @ts-ignore
    const timestamp = dato(constants.epoch).addSeconds(epochStamp);

    return {
        epoch: epochStamp,
        unix: timestamp.toUnix(),
        human: timestamp.toISO(),
    };
}
