import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import semver from "semver";

// todo: review the implementation
export const isValidVersion = (
    app: Contracts.Kernel.Application,
    peer: Contracts.P2P.Peer,
    cryptoManager: CryptoSuite.CryptoManager,
): boolean => {
    if (!peer.version) {
        return false;
    }

    if (!semver.valid(peer.version)) {
        return false;
    }

    let minimumVersions: string[];
    const milestones: Record<string, any> = cryptoManager.MilestoneManager.getMilestone();

    const { p2p } = milestones;

    if (p2p && Array.isArray(p2p.minimumVersions) && p2p.minimumVersions.length > 0) {
        minimumVersions = p2p.minimumVersions;
    } else {
        const configuration = app.getTagged<Providers.PluginConfiguration>(
            Container.Identifiers.PluginConfiguration,
            "plugin",
            "@arkecosystem/core-p2p",
        );
        minimumVersions = configuration.getOptional<string[]>("minimumVersions", []);
    }

    const includePrerelease: boolean = cryptoManager.NetworkConfigManager.get("network.name") !== "mainnet";
    return minimumVersions.some((minimumVersion: string) =>
        // @ts-ignore - check why the peer.version errors even though we exit early
        semver.satisfies(peer.version, minimumVersion, { includePrerelease }),
    );
};
