import { process } from "ipaddr.js";

/**
 * Parses the given ip and returns wether it could be parsed or not.
 */
export const parseRemoteAddress = (peer: { ip: string }): boolean => {
    try {
        peer.ip = process(peer.ip).toString();

        return true;
    } catch (error) {
        return false;
    }
};
