import nm from "nanomatch";

// todo: review the implementation
export const isBlacklisted = (whitelist: string[], remoteAddress: string): boolean => {
    if (!Array.isArray(whitelist) || !whitelist.length) {
        return false;
    }

    for (const ip of whitelist) {
        try {
            if (nm.isMatch(remoteAddress, ip)) {
                return true;
            }
        } catch {}
    }

    return false;
};
