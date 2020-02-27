"use strict";
exports.__esModule = true;
var event_listener_1 = require("../../packages/core-p2p/src/event-listener");
var peer_1 = require("../../packages/core-p2p/src/peer");
var plugin_1 = require("../../packages/core-p2p/src/plugin");
exports.createStubPeer = function (stub) {
    var peer = new peer_1.Peer(stub.ip);
    peer.port = stub.port;
    delete stub.port;
    return Object.assign(peer, stub);
};
exports.createPeerService = function () {
    var service = plugin_1.makePeerService({});
    // tslint:disable-next-line: no-unused-expression
    new event_listener_1.EventListener(service);
    return {
        service: service,
        storage: service.getStorage(),
        processor: service.getProcessor(),
        connector: service.getConnector(),
        communicator: service.getCommunicator(),
        monitor: service.getMonitor()
    };
};
exports.stubPeer = exports.createStubPeer({ ip: "1.2.3.4", port: 4000 });
