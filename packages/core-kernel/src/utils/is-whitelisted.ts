import nm from "nanomatch";

export const isWhitelisted = (whitelist: string[], remoteAddress: string): boolean => {
    if (!Array.isArray(whitelist) || !whitelist.length) {
        return true;
    }

    if (Array.isArray(whitelist)) {
        for (const ip of whitelist) {
            try {
                if (nm.isMatch(remoteAddress, ip)) {
                    return true;
                }
            } catch {
                return false;
            }
        }
    }

    return false;
};
