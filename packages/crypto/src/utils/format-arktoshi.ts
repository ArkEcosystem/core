import { ARKTOSHI } from "../constants";
import { configManager } from "../managers/config";

/**
 * Get human readable string from arktoshis
 * @param  {Number|String|Bignum} amount
 * @return {String}
 */
export const formatArktoshi = amount => {
    const localeString = (+amount / ARKTOSHI).toLocaleString("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8,
    });

    return `${localeString} ${configManager.config.client.symbol}`;
};
