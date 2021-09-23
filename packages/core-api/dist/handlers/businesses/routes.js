"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const controller_1 = require("./controller");
const Schema = __importStar(require("./schema"));
exports.registerRoutes = (server) => {
    const controller = new controller_1.BusinessController();
    server.bind(controller);
    server.route({
        method: "GET",
        path: "/businesses",
        handler: controller.index,
        options: {
            validate: Schema.index,
        },
    });
    server.route({
        method: "GET",
        path: "/businesses/{id}",
        handler: controller.show,
        options: {
            validate: Schema.show,
        },
    });
    server.route({
        method: "GET",
        path: "/businesses/{id}/bridgechains",
        handler: controller.bridgechains,
        options: {
            validate: Schema.bridgechains,
        },
    });
    server.route({
        method: "GET",
        path: "/businesses/{businessId}/bridgechains/{bridgechainId}",
        handler: controller.bridgechain,
        options: {
            validate: Schema.bridgechain,
        },
    });
    server.route({
        method: "POST",
        path: "/businesses/search",
        handler: controller.search,
        options: {
            validate: Schema.search,
        },
    });
};
//# sourceMappingURL=routes.js.map