"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const socketcluster_client_1 = require("socketcluster-client");
const peer_repository_1 = require("./peer-repository");
const sc_codec_1 = require("./utils/sc-codec");
class PeerConnector {
    constructor() {
        this.connections = new peer_repository_1.PeerRepository();
        this.errors = new Map();
    }
    all() {
        return this.connections.values();
    }
    connection(peer) {
        return this.connections.get(peer.ip);
    }
    connect(peer, maxPayload) {
        const connection = this.connection(peer) || this.create(peer);
        const socket = connection.transport.socket;
        if (maxPayload && socket._receiver) {
            socket._receiver._maxPayload = maxPayload;
        }
        this.connections.set(peer.ip, connection);
        return connection;
    }
    disconnect(peer) {
        const connection = this.connection(peer);
        if (connection) {
            connection.destroy();
            this.connections.forget(peer.ip);
        }
    }
    terminate(peer) {
        const connection = this.connection(peer);
        if (connection) {
            connection.transport.socket.terminate();
            this.connections.forget(peer.ip);
        }
    }
    emit(peer, event, data) {
        this.connection(peer).emit(event, data);
    }
    getError(peer) {
        return this.errors.get(peer.ip);
    }
    setError(peer, error) {
        this.errors.set(peer.ip, error);
    }
    hasError(peer, error) {
        return this.getError(peer) === error;
    }
    forgetError(peer) {
        this.errors.delete(peer.ip);
    }
    create(peer) {
        const connection = socketcluster_client_1.create({
            port: peer.port,
            hostname: peer.ip,
            ackTimeout: Math.max(core_container_1.app.resolveOptions("p2p").getBlocksTimeout, core_container_1.app.resolveOptions("p2p").verifyTimeout),
            perMessageDeflate: false,
            codecEngine: sc_codec_1.codec,
            // @ts-ignore
            maxPayload: 102400,
        });
        const socket = connection.transport.socket;
        socket.on("ping", () => this.terminate(peer));
        socket.on("pong", () => this.terminate(peer));
        socket.on("message", data => {
            if (data === "#1") {
                // this is to establish some rate limit on #1 messages
                // a simple rate limit of 1 per second doesnt seem to be enough, so decided to give some margin
                // and allow up to 10 per second which should be more than enough
                const timeNow = new Date().getTime();
                socket._last10Pings = socket._last10Pings || [];
                socket._last10Pings.push(timeNow);
                if (socket._last10Pings.length >= 10) {
                    socket._last10Pings = socket._last10Pings.slice(socket._last10Pings.length - 10);
                    if (timeNow - socket._last10Pings[0] < 1000) {
                        this.terminate(peer);
                    }
                }
            }
        });
        connection.on("error", () => this.disconnect(peer));
        return connection;
    }
}
exports.PeerConnector = PeerConnector;
//# sourceMappingURL=peer-connector.js.map