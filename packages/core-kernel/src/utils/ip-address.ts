import ipaddr from "ipaddr.js";

export const isIPv6Address = (ip: string) => {
    try {
        return ipaddr.parse(ip).kind() === "ipv6";
    } catch {}

    return false;
};

