import nm from "nanomatch";

// todo: review the implementation
export const isBlacklisted = (blacklist: string[], remoteAddress: string): boolean => {
    if (!Array.isArray(blacklist) || !blacklist.length) {
        return false;
    }

    for (const ip of blacklist) {
        try {
            if (nm.isMatch(remoteAddress, ip)) {
                return true;
            }
        } catch {}
    }

    return false;
};
