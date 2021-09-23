"use strict";
/* tslint:disable:max-line-length */
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const crypto_1 = require("@arkecosystem/crypto");
const peer_1 = require("./peer");
const utils_1 = require("./utils");
class PeerProcessor {
    constructor({ communicator, connector, storage, }) {
        this.logger = core_container_1.app.resolvePlugin("logger");
        this.emitter = core_container_1.app.resolvePlugin("event-emitter");
        this.communicator = communicator;
        this.connector = connector;
        this.storage = storage;
        this.emitter.on(core_event_emitter_1.ApplicationEvents.InternalMilestoneChanged, () => {
            this.updatePeersAfterMilestoneChange();
        });
    }
    async validateAndAcceptPeer(peer, options = {}) {
        if (this.validatePeerIp(peer, options)) {
            await this.acceptNewPeer(peer, options);
        }
    }
    validatePeerIp(peer, options = {}) {
        if (core_container_1.app.resolveOptions("p2p").disableDiscovery && !this.storage.hasPendingPeer(peer.ip)) {
            this.logger.warn(`Rejected ${peer.ip} because the relay is in non-discovery mode.`);
            return false;
        }
        if (!crypto_1.Utils.isValidPeer(peer) || this.storage.hasPendingPeer(peer.ip)) {
            return false;
        }
        if (!utils_1.isWhitelisted(core_container_1.app.resolveOptions("p2p").whitelist, peer.ip)) {
            return false;
        }
        if (this.storage.getSameSubnetPeers(peer.ip).length >= core_container_1.app.resolveOptions("p2p").maxSameSubnetPeers &&
            !options.seed) {
            if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                this.logger.warn(`Rejected ${peer.ip} because we are already at the ${core_container_1.app.resolveOptions("p2p").maxSameSubnetPeers} limit for peers sharing the same /24 subnet.`);
            }
            return false;
        }
        return true;
    }
    updatePeersAfterMilestoneChange() {
        const peers = this.storage.getPeers();
        for (const peer of peers) {
            if (!utils_1.isValidVersion(peer)) {
                this.emitter.emit("internal.p2p.disconnectPeer", { peer });
            }
        }
    }
    async acceptNewPeer(peer, options = {}) {
        if (this.storage.getPeer(peer.ip)) {
            return;
        }
        const newPeer = new peer_1.Peer(peer.ip);
        try {
            this.storage.setPendingPeer(peer);
            await this.communicator.ping(newPeer, core_container_1.app.resolveOptions("p2p").verifyTimeout);
            this.storage.setPeer(newPeer);
            if (!options.lessVerbose || process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                this.logger.debug(`Accepted new peer ${newPeer.ip}:${newPeer.port} (v${newPeer.version})`);
            }
            this.emitter.emit(core_event_emitter_1.ApplicationEvents.PeerAdded, newPeer);
        }
        catch (error) {
            this.connector.disconnect(newPeer);
        }
        finally {
            this.storage.forgetPendingPeer(peer);
        }
        return;
    }
}
exports.PeerProcessor = PeerProcessor;
//# sourceMappingURL=peer-processor.js.map