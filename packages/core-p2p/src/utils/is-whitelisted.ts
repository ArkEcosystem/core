import mm from "micromatch";

/**
 * Check if the given IP address is whitelisted.
 */
export const isWhitelisted = (whitelist: string[], ip: string): boolean => {
    if (Array.isArray(whitelist)) {
        for (const item of whitelist) {
            if (mm.isMatch(ip, item)) {
                return true;
            }
        }
    }

    return false;
};
