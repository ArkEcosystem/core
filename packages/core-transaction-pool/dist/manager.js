"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const factory_1 = require("./factory");
class ConnectionManager {
    constructor() {
        this.factory = new factory_1.ConnectionFactory();
        this.connections = new Map();
    }
    connection(name = "default") {
        return this.connections.get(name);
    }
    async createConnection(connection, name = "default") {
        this.connections.set(name, await this.factory.make(connection));
        return this.connection(name);
    }
}
exports.ConnectionManager = ConnectionManager;
//# sourceMappingURL=manager.js.map