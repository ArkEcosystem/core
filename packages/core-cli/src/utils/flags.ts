import { AnyObject } from "../contracts";

export const castFlagsToString = (flags: AnyObject, ignoreKeys: string[] = []): string => {
    const stringFlags: string[] = [];

    for (const [key, value] of Object.entries(flags)) {
        if (!ignoreKeys.includes(key) && value !== undefined) {
            if (value === true) {
                stringFlags.push(`--${key}`);
            } else if (typeof value === "string") {
                stringFlags.push(`--${key}='${value}'`);
            } else {
                stringFlags.push(`--${key}=${value}`);
            }
        }
    }

    return stringFlags.join(" ");
};
