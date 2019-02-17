import { SATOSHI } from "../constants";
import { configManager } from "../managers";
import { Bignum } from "./bignum";

/**
 * Get human readable string from satoshis
 */
export const formatSatoshi = (amount: Bignum | number | string): string => {
    const localeString = (+amount / SATOSHI).toLocaleString("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8,
    });

    return `${localeString} ${configManager.config.client.symbol}`;
};
