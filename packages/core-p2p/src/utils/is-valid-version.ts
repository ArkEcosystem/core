import { app, Contracts } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import semver from "semver";

export const isValidVersion = (peer: Contracts.P2P.Peer): boolean => {
    if (!semver.valid(peer.version)) {
        return false;
    }

    let minimumVersions: string[];
    const milestones: Record<string, any> = Managers.configManager.getMilestone();

    const { p2p } = milestones;

    if (p2p && Array.isArray(p2p.minimumVersions) && p2p.minimumVersions.length > 0) {
        minimumVersions = p2p.minimumVersions;
    } else {
        minimumVersions = app.get<{ minimumVersions: string[] }>("p2p.options").minimumVersions;
    }

    return minimumVersions.some((minimumVersion: string) => semver.satisfies(peer.version, minimumVersion));
};
