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
    const { p2p } = milestones;
    if (p2p && Array.isArray(p2p.minimumVersions) && p2p.minimumVersions.length > 0) {
        minimumVersions = p2p.minimumVersions;
    } else {
        minimumVersions = app.resolveOptions("p2p").minimumVersions;
    }

    const includePrerelease: boolean = Managers.configManager.get("network.name") !== "mainnet";
    return minimumVersions.some((minimumVersion: string) =>
        semver.satisfies(peer.version, minimumVersion, { includePrerelease }),
    );
};
