import { Interfaces } from "@arkecosystem/core-crypto";
import { CryptoManager } from "@arkecosystem/crypto";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const formatTimestamp = (
    epochStamp: number,
    cryptoManager: CryptoManager<Interfaces.IBlockData>,
): {
    epoch: number;
    unix: number;
    human: string;
} => {
    const timestamp: Dayjs = dayjs.utc(cryptoManager.MilestoneManager.getMilestone().epoch).add(epochStamp, "second");

    return {
        epoch: epochStamp,
        unix: timestamp.unix(),
        human: timestamp.toISOString(),
    };
};
