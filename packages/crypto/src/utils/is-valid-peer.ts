import { parse, process } from "ipaddr.js";
import os from "os";

// todo: review the implementation of all methods

export const isLocalHost = (ip: string): boolean => {
    try {
        const parsed = parse(ip);
        if (parsed.range() === "loopback" || ip.startsWith("0") || ["127.0.0.1", "::ffff:127.0.0.1"].includes(ip)) {
            return true;
        }

        const interfaces: {
            [index: string]: os.NetworkInterfaceInfo[];
        } = os.networkInterfaces();

        return Object.keys(interfaces).some(ifname => interfaces[ifname].some(iface => iface.address === ip));
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

export const isValidPeer = (peer: { ip: string; status?: string | number }): boolean => {
    const sanitizedAddress: string | undefined = sanitizeRemoteAddress(peer.ip);

    if (!sanitizedAddress) {
        return false;
    }

    peer.ip = sanitizedAddress;

    if (isLocalHost(peer.ip)) {
        return false;
    }

    return true;
};
