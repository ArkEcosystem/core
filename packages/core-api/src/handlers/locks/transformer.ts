import { formatTimestamp } from "@arkecosystem/core-utils";
import { expirationCalculator } from "@arkecosystem/core-utils";

export const transformLock = lock => {
    return {
        ...lock,
        amount: lock.amount.toFixed(),
        timestamp: formatTimestamp(lock.timestamp),
        isExpired: expirationCalculator.calculateLockExpirationStatus({
            type: lock.expirationType,
            value: lock.expirationValue,
        }),
    };
};
