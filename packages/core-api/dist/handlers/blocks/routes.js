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
    const controller = new controller_1.BlocksController();
    server.bind(controller);
    server.route({
        method: "GET",
        path: "/blocks",
        handler: controller.index,
        options: {
            validate: Schema.index,
        },
    });
    server.route({
        method: "GET",
        path: "/blocks/first",
        handler: controller.first,
        options: {
            validate: Schema.first,
        },
    });
    server.route({
        method: "GET",
        path: "/blocks/last",
        handler: controller.last,
        options: {
            validate: Schema.last,
        },
    });
    server.route({
        method: "GET",
        path: "/blocks/{id}",
        handler: controller.show,
        options: {
            validate: Schema.show,
        },
    });
    server.route({
        method: "GET",
        path: "/blocks/{id}/transactions",
        handler: controller.transactions,
        options: {
            validate: Schema.transactions,
        },
    });
    server.route({
        method: "POST",
        path: "/blocks/search",
        handler: controller.search,
        options: {
            validate: Schema.search,
        },
    });
};
//# sourceMappingURL=routes.js.map