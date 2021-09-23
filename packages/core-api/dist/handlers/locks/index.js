"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const methods_1 = require("./methods");
const routes_1 = require("./routes");
exports.register = (server) => {
    methods_1.registerMethods(server);
    routes_1.registerRoutes(server);
};
//# sourceMappingURL=index.js.map