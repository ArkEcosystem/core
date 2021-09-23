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
    const controller = new controller_1.DelegatesController();
    server.bind(controller);
    server.route({
        method: "GET",
        path: "/delegates",
        handler: controller.index,
        options: {
            validate: Schema.index,
        },
    });
    server.route({
        method: "GET",
        path: "/delegates/{id}",
        handler: controller.show,
        options: {
            validate: Schema.show,
        },
    });
    server.route({
        method: "GET",
        path: "/delegates/{id}/blocks",
        handler: controller.blocks,
        options: {
            validate: Schema.blocks,
        },
    });
    server.route({
        method: "GET",
        path: "/delegates/{id}/voters",
        handler: controller.voters,
        options: {
            validate: Schema.voters,
        },
    });
    server.route({
        method: "POST",
        path: "/delegates/search",
        handler: controller.search,
        options: {
            validate: Schema.search,
        },
    });
};
//# sourceMappingURL=routes.js.map