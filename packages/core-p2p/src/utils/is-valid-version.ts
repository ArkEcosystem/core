import { app, Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import semver from "semver";

// todo: review the implementation
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
        minimumVersions = app
            .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
            .get("@arkecosystem/core-p2p")
            .config()
            .get<string[]>("minimumVersions");
    }

    const includePrerelease: boolean = Managers.configManager.get("network.name") !== "mainnet";
    return minimumVersions.some((minimumVersion: string) =>
        semver.satisfies(peer.version, minimumVersion, { includePrerelease }),
    );
};
