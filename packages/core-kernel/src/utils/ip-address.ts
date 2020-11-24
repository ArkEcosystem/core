import ipaddr from "ipaddr.js";

export const isIPv6Address = (ip: string) => {
    try {
        return ipaddr.parse(clean(ip)).kind() === "ipv6";
    } catch {}

    return false;
};

export const normalizeAddress = (ip: string) => {
    ip = clean(ip);

    if (isIPv6Address(ip)) {
        return `[${ip}]`;
    }

    return ip;
};

const clean = (ip: string) => {
    return ip.replace("[", "").replace("]", "");
};
