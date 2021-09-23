"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaults_1 = require("./defaults");
const event_listener_1 = require("./event-listener");
const network_monitor_1 = require("./network-monitor");
const peer_communicator_1 = require("./peer-communicator");
const peer_connector_1 = require("./peer-connector");
const peer_processor_1 = require("./peer-processor");
const peer_service_1 = require("./peer-service");
const peer_storage_1 = require("./peer-storage");
const socket_server_1 = require("./socket-server");
exports.makePeerService = (options) => {
    const storage = new peer_storage_1.PeerStorage();
    const connector = new peer_connector_1.PeerConnector();
    const communicator = new peer_communicator_1.PeerCommunicator(connector);
    const processor = new peer_processor_1.PeerProcessor({ storage, connector, communicator });
    const monitor = new network_monitor_1.NetworkMonitor({ storage, processor, communicator, options });
    return new peer_service_1.PeerService({ storage, processor, connector, communicator, monitor });
};
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    required: true,
    alias: "p2p",
    async register(container, options) {
        container.resolvePlugin("logger").info("Starting P2P Interface");
        const service = exports.makePeerService(options);
        // tslint:disable-next-line: no-unused-expression
        new event_listener_1.EventListener(service);
        if (!process.env.DISABLE_P2P_SERVER) {
            service.getMonitor().setServer(await socket_server_1.startSocketServer(service, options));
        }
        return service;
    },
    async deregister(container, options) {
        container.resolvePlugin("logger").info("Stopping P2P Interface");
        container
            .resolvePlugin("p2p")
            .getMonitor()
            .stopServer();
    },
};
//# sourceMappingURL=plugin.js.map