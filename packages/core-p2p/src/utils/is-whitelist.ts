import mm from "micromatch";

/**
 * Check if the given IP address is whitelisted.
 * @param  {[]String} value
 * @param  {String} value
 * @return {boolean}
 */
export = (whitelist, value) => {
    if (Array.isArray(whitelist)) {
        for (const item of whitelist) {
            if (mm.isMatch(value, item)) {
                return true;
            }
        }
    }

    return false;
};
