import { parse, process } from "ipaddr.js";
import os from "os";

export const isLocalHost = (ip: string, includeNetworkInterfaces: boolean = true): boolean => {
    try {
        const parsed = parse(ip);
        if (parsed.range() === "loopback" || ip.startsWith("0") || ["127.0.0.1", "::ffff:127.0.0.1"].includes(ip)) {
            return true;
        }

        if (includeNetworkInterfaces) {
            const interfaces: {
                [index: string]: os.NetworkInterfaceInfo[];
            } = os.networkInterfaces();

            return Object.keys(interfaces).some(ifname => interfaces[ifname].some(iface => iface.address === ip));
        }

        return false;
    } catch (error) {
        return false;
    }
};

const sanitizeRemoteAddress = (ip: string): string | undefined => {
    try {
        return process(ip).toString();
    } catch (error) {
        return undefined;
    }
};

export const isValidPeer = (peer: { ip: string }, includeNetworkInterfaces: boolean = true): boolean => {
    peer.ip = sanitizeRemoteAddress(peer.ip);
    if (!peer.ip) {
        return false;
    }

    if (isLocalHost(peer.ip, includeNetworkInterfaces)) {
        return false;
    }

    return true;
};
