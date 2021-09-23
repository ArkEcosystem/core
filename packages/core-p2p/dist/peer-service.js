"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PeerService {
    constructor({ communicator, connector, monitor, processor, storage, }) {
        this.communicator = communicator;
        this.connector = connector;
        this.monitor = monitor;
        this.processor = processor;
        this.storage = storage;
    }
    getStorage() {
        return this.storage;
    }
    getProcessor() {
        return this.processor;
    }
    getConnector() {
        return this.connector;
    }
    getCommunicator() {
        return this.communicator;
    }
    getMonitor() {
        return this.monitor;
    }
}
exports.PeerService = PeerService;
//# sourceMappingURL=peer-service.js.map