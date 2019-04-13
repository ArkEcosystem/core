import { app } from "@arkecosystem/core-container";
import { dato } from "@faustbrian/dato";

export function formatTimestamp(
    epochStamp: string,
): {
    epoch: string;
    unix: number;
    human: string;
} {
    const constants = app.getConfig().getMilestone(1);
    // @ts-ignore
    const timestamp = dato(constants.epoch).addSeconds(epochStamp);

    return {
        epoch: epochStamp,
        unix: timestamp.toUnix(),
        human: timestamp.toISO(),
    };
}
