import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import semver from "semver";

export const isValidVersion = (app: Contracts.Kernel.Application, peer: Contracts.P2P.Peer): boolean => {
    if (!peer.version) {
        return false;
    }

    if (!semver.valid(peer.version)) {
        return false;
    }

    const includePrerelease: boolean = Managers.configManager.get("network.name") !== "mainnet";

    return (
        isValidConfigVersion(app, peer.version, includePrerelease) &&
        isValidMilestoneVersion(peer.version, includePrerelease)
    );
};

const isValidConfigVersion = (
    app: Contracts.Kernel.Application,
    version: string,
    includePrerelease: boolean,
): boolean => {
    const configuration = app.getTagged<Providers.PluginConfiguration>(
        Container.Identifiers.PluginConfiguration,
        "plugin",
        "@arkecosystem/core-p2p",
    );

    const minimumVersions = configuration.getOptional<string[]>("minimumVersions", []);

    if (minimumVersions.length > 0) {
        return minimumVersions.some((minimumVersion: string) =>
            semver.satisfies(version, minimumVersion, { includePrerelease }),
        );
    }

    return true;
};

const isValidMilestoneVersion = (version: string, includePrerelease: boolean): boolean => {
    const { p2p } = Managers.configManager.getMilestone();

    if (p2p && Array.isArray(p2p.minimumVersions) && p2p.minimumVersions.length > 0) {
        return p2p.minimumVersions.some((minimumVersion: string) =>
            semver.satisfies(version, minimumVersion, { includePrerelease }),
        );
    }

    return true;
};
