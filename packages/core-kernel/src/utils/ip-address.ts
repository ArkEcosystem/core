import ipaddr from "ipaddr.js";

export const isValidAddress = (ip: string) => {
    return ipaddr.isValid(cleanAddress(ip));
};

export const isIPv6Address = (ip: string) => {
    try {
        return ipaddr.parse(cleanAddress(ip)).kind() === "ipv6";
    } catch {}

    return false;
};

export const normalizeAddress = (ip: string) => {
    ip = cleanAddress(ip);

    if (isIPv6Address(ip)) {
        return `[${ip}]`;
    }

    return ip;
};

export const cleanAddress = (ip: string) => {
    return ip.replace("[", "").replace("]", "");
};
