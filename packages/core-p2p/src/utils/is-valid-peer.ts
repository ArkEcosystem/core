import { process } from "ipaddr.js";
import os from "os";

/**
 * Checks if the peer is a valid remote peer.
 */
export const isValidPeer = (peer: { ip: string; status?: string | number }): boolean => {
    peer.ip = sanitizeRemoteAddress(peer.ip);

    if (!peer.ip) {
        return false;
    }

    if (isMyself(peer.ip)) {
        return false;
    }

    if (peer.status) {
        if (peer.status !== 200 && peer.status !== "OK") {
            return false;
        }
    }

    return true;
};

/**
 * Sanitizes the given ip and returns it sanitized ip on success or null on failure.
 */
const sanitizeRemoteAddress = (ip: string): string | null => {
    try {
        return process(ip).toString();
    } catch (error) {
        return null;
    }
};

const isMyself = (ipAddress: string): boolean => {
    const interfaces = os.networkInterfaces();

    return (
        ipAddress.startsWith("127.") ||
        ipAddress.startsWith("0.") ||
        Object.keys(interfaces).some(ifname => interfaces[ifname].some(iface => iface.address === ipAddress))
    );
};
