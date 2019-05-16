import { app } from "@arkecosystem/core-container";
import { P2P } from "@arkecosystem/core-interfaces";
import semver from "semver";

export const isValidVersion = (peer: P2P.IPeer): boolean => {
    if (!semver.valid(peer.version)) {
        return false;
    }

    return app
        .resolveOptions("p2p")
        .minimumVersions.some((minimumVersion: string) => semver.satisfies(peer.version, minimumVersion));
};
