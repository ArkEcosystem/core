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
    const controller = new controller_1.RoundsController();
    server.bind(controller);
    server.route({
        method: "GET",
        path: "/rounds/{id}/delegates",
        handler: controller.delegates,
        options: {
            validate: Schema.delegates,
        },
    });
};
//# sourceMappingURL=routes.js.map