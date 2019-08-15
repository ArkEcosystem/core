import { app } from "@arkecosystem/core-kernel";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const formatTimestamp = (
    epochStamp: number,
): {
    epoch: number;
    unix: number;
    human: string;
} => {
    const timestamp: Dayjs = dayjs.utc(app.getConfig().getMilestone().epoch).add(epochStamp, "second");

    return {
        epoch: epochStamp,
        unix: timestamp.unix(),
        human: timestamp.toISOString(),
    };
};
