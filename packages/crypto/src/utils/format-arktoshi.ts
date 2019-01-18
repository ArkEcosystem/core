import { ARKTOSHI } from "../constants";
import { configManager } from "../managers";
import { Bignum } from "./bignum";

/**
 * Get human readable string from arktoshis
 */
export const formatArktoshi = (amount: Bignum | number | string): string => {
    const localeString = (+amount / ARKTOSHI).toLocaleString("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8,
    });

    return `${localeString} ${configManager.config.client.symbol}`;
};
