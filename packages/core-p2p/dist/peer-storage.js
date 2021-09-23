"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ip_1 = require("ip");
const peer_repository_1 = require("./peer-repository");
class PeerStorage {
    constructor() {
        this.peers = new peer_repository_1.PeerRepository();
        this.peersPending = new peer_repository_1.PeerRepository();
    }
    getPeers() {
        return this.peers.values();
    }
    hasPeers() {
        return this.peers.isNotEmpty();
    }
    getPeer(ip) {
        return this.peers.get(ip);
    }
    setPeer(peer) {
        this.peers.set(peer.ip, peer);
    }
    forgetPeer(peer) {
        this.peers.forget(peer.ip);
    }
    hasPeer(ip) {
        return this.peers.has(ip);
    }
    getPendingPeers() {
        return this.peersPending.values();
    }
    hasPendingPeers() {
        return this.peersPending.isNotEmpty();
    }
    getPendingPeer(ip) {
        return this.peersPending.get(ip);
    }
    setPendingPeer(peer) {
        this.peersPending.set(peer.ip, peer);
    }
    forgetPendingPeer(peer) {
        this.peersPending.forget(peer.ip);
    }
    hasPendingPeer(ip) {
        return this.peersPending.has(ip);
    }
    getSameSubnetPeers(ip) {
        return this.getPeers().filter(peer => ip_1.cidr(`${peer.ip}/24`) === ip_1.cidr(`${ip}/24`));
    }
}
exports.PeerStorage = PeerStorage;
//# sourceMappingURL=peer-storage.js.map