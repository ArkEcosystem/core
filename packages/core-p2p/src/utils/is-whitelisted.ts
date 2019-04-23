import nm from "nanomatch";

/**
 * Check if the given IP address is whitelisted.
 */
export const isWhitelisted = (whitelist: string[], ip: string): boolean => {
    if (Array.isArray(whitelist)) {
        for (const item of whitelist) {
            if (nm.isMatch(ip, item)) {
                return true;
            }
        }
    }

    return false;
};
