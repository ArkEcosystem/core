"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controller_1 = require("./controller");
exports.registerRoutes = (server) => {
    const controller = new controller_1.BlockchainController();
    server.bind(controller);
    server.route({
        method: "GET",
        path: "/blockchain",
        handler: controller.index,
    });
};
//# sourceMappingURL=routes.js.map