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
    const controller = new controller_1.VotesController();
    server.bind(controller);
    server.route({
        method: "GET",
        path: "/votes",
        handler: controller.index,
        options: {
            validate: Schema.index,
        },
    });
    server.route({
        method: "GET",
        path: "/votes/{id}",
        handler: controller.show,
        options: {
            validate: Schema.show,
        },
    });
};
//# sourceMappingURL=routes.js.map