"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
class EventListener {
    constructor(service) {
        this.emitter = core_container_1.app.resolvePlugin("event-emitter");
        const connector = service.getConnector();
        const storage = service.getStorage();
        this.emitter.on("internal.p2p.disconnectPeer", ({ peer }) => {
            connector.disconnect(peer);
            storage.forgetPeer(peer);
        });
        const exitHandler = () => service.getMonitor().stopServer();
        process.on("SIGINT", exitHandler);
        process.on("exit", exitHandler);
    }
}
exports.EventListener = EventListener;
//# sourceMappingURL=event-listener.js.map