import { app } from "@arkecosystem/core-kernel";
import dayjs from "dayjs-ext";

/**
 * Format the given epoch based timestamp into human and unix.
 * @param  {Number} epochStamp
 * @return {Object}
 */
function formatTimestamp(epochStamp) {
    const constants = app.getConfig().getMilestone(1);
    // @ts-ignore
    const timestamp = dayjs(constants.epoch).add(epochStamp, "seconds");

    return {
        epoch: epochStamp,
        unix: timestamp.unix(),
        human: timestamp.toISOString(),
    };
}

export { formatTimestamp };
