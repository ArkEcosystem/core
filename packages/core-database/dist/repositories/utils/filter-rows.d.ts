import { Database } from "@arkecosystem/core-interfaces";
declare const _default: <T = any>(rows: readonly T[], params: Database.IParameters, filters: Record<string, string[]>) => T[];
/**
 * Filter an Array of Objects based on the given parameters.
 * @param  {Array} rows
 * @param  {Object} params
 * @param  {Object} filters
 * @return {Array}
 */
export = _default;
