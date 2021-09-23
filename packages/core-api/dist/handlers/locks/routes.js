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
    const controller = new controller_1.LocksController();
    server.bind(controller);
    server.route({
        method: "GET",
        path: "/locks",
        handler: controller.index,
        options: {
            validate: Schema.index,
        },
    });
    server.route({
        method: "GET",
        path: "/locks/{id}",
        handler: controller.show,
        options: {
            validate: Schema.show,
        },
    });
    server.route({
        method: "POST",
        path: "/locks/search",
        handler: controller.search,
        options: {
            validate: Schema.search,
        },
    });
    server.route({
        method: "POST",
        path: "/locks/unlocked",
        handler: controller.unlocked,
        options: {
            validate: Schema.unlocked,
        },
    });
};
//# sourceMappingURL=routes.js.map