import { parse, process } from "ipaddr.js";
import os from "os";

/**
 * Checks if the peer is a valid remote peer.
 */
export const isValidPeer = (peer: { ip: string; status?: string | number }): boolean => {
    peer.ip = sanitizeRemoteAddress(peer.ip);

    if (!peer.ip) {
        return false;
    }

    if (isLocalHost(peer.ip)) {
        return false;
    }

    if (peer.status) {
        if (peer.status !== 200 && peer.status !== "OK") {
            return false;
        }
    }

    return true;
};

export const isLocalHost = (ip: string): boolean => {
    try {
        const parsed = parse(ip);
        if (parsed.range() === "loopback") {
            return true;
        }

        if (ip.startsWith("0")) {
            return true;
        }

        const interfaces = os.networkInterfaces();
        return Object.keys(interfaces).some(ifname => interfaces[ifname].some(iface => iface.address === ip));
    } catch (error) {
        return false;
    }
};

const sanitizeRemoteAddress = (ip: string): string | null => {
    try {
        return process(ip).toString();
    } catch (error) {
        return null;
    }
};
