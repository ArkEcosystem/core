import { isMyself } from "./is-myself";
import { parseRemoteAddress } from "./parse-remote-address";

/**
 * Checks if the peer is a valid remote peer.
 */
export const isValidPeer = (peer: { ip: string; status?: string | number }): boolean => {
    if (!parseRemoteAddress(peer)) {
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
