"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const crypto_1 = require("@arkecosystem/crypto");
const semver_1 = __importDefault(require("semver"));
exports.isValidVersion = (peer) => {
    if (!semver_1.default.valid(peer.version)) {
        return false;
    }
    let minimumVersions;
    const milestones = crypto_1.Managers.configManager.getMilestone();
    const { p2p } = milestones;
    if (p2p && Array.isArray(p2p.minimumVersions) && p2p.minimumVersions.length > 0) {
        minimumVersions = p2p.minimumVersions;
    }
    else {
        minimumVersions = core_container_1.app.resolveOptions("p2p").minimumVersions;
    }
    const includePrerelease = crypto_1.Managers.configManager.get("network.name") !== "mainnet";
    return minimumVersions.some((minimumVersion) => semver_1.default.satisfies(peer.version, minimumVersion, { includePrerelease }));
};
//# sourceMappingURL=is-valid-version.js.map