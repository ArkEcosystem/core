import { ARKTOSHI } from "../constants";
import { configManager } from "../managers/config";

/**
 * Get human readable string from arktoshis
 * @param  {Number|String|Bignum} amount
 * @return {String}
 */
export const formatArktoshi = amount => {
  const decimalPlaces = ARKTOSHI.toString().length - 1
  const localeString = (+amount / ARKTOSHI).toLocaleString("en", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return `${configManager.config.client.symbol}${localeString}`;
};