import { app } from "@arkecosystem/core-container";
import { P2P } from "@arkecosystem/core-interfaces";
import { Managers } from "@arkecosystem/crypto";
import semver from "semver";

export const isValidVersion = (peer: P2P.IPeer): boolean => {
    if (!semver.valid(peer.version)) {
        return false;
    }

    let minimumVersions: string[];
    const milestones: Record<string, any> = Managers.configManager.getMilestone();
    if (milestones.p2p && milestones.p2p.minimumVersions && milestones.p2p.minimumVersions.length > 0) {
        minimumVersions = milestones.p2p.minimumVersions;
    } else {
        minimumVersions = app.resolveOptions("p2p").minimumVersions;
    }

    return minimumVersions.some((minimumVersion: string) => semver.satisfies(peer.version, minimumVersion));
};
