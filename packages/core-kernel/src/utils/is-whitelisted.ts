import nm from "nanomatch";

// todo: review the implementation
export const isWhitelisted = (whitelist: string[], remoteAddress: string): boolean => {
    if (!Array.isArray(whitelist) || !whitelist.length) {
        return true;
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
