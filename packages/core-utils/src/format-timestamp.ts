import { app } from "@arkecosystem/core-container";
import { Dato } from "@arkecosystem/utils";

/**
 * Format the given epoch based timestamp into human and unix.
 * @param  {Number} epochStamp
 * @return {Object}
 */
export function formatTimestamp(epochStamp) {
    const constants = app.getConfig().getMilestone(1);
    // @ts-ignore
    const timestamp = Dato.fromString(constants.epoch).addSeconds(epochStamp);

    return {
        epoch: epochStamp,
        unix: timestamp.toUnix(),
        human: timestamp.toISO(),
    };
}
