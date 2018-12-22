import { ARKTOSHI } from "../constants";
import { configManager } from "../managers/config";

/**
 * Get human readable string from arktoshis
 * @param  {Number|String|Bignum} amount
 * @return {String}
 */
export const formatArktoshi = amount => {
  const decimalPlaces = ARKTOSHI.toString().length - 1
  let localeString = (+amount / ARKTOSHI).toLocaleString("en", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  if (localeString.substr(-decimalPlaces) === "0".repeat(decimalPlaces)) {
    localeString = localeString.substr(0, localeString.length - decimalPlaces - 1)
  }

  return `${configManager.config.client.symbol}${localeString}`;
};