"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const dayjs_1 = __importDefault(require("dayjs"));
const peer_verifier_1 = require("./peer-verifier");
class Peer {
    constructor(ip) {
        this.ip = ip;
        this.ports = {};
        this.port = +core_container_1.app.resolveOptions("p2p").server.port;
        this.state = {
            height: undefined,
            forgingAllowed: undefined,
            currentSlot: undefined,
            header: {},
        };
        this.plugins = {};
    }
    get url() {
        return `${this.port % 443 === 0 ? "https://" : "http://"}${this.ip}:${this.port}`;
    }
    isVerified() {
        return this.verificationResult instanceof peer_verifier_1.PeerVerificationResult;
    }
    isForked() {
        return this.isVerified() && this.verificationResult.forked;
    }
    recentlyPinged() {
        return !!this.lastPinged && dayjs_1.default().diff(this.lastPinged, "minute") < 2;
    }
    toBroadcast() {
        return {
            ip: this.ip,
            ports: this.ports,
            version: this.version,
            height: this.state.height,
            latency: this.latency,
        };
    }
}
exports.Peer = Peer;
//# sourceMappingURL=peer.js.map