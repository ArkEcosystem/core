"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wreck_1 = __importDefault(require("@hapi/wreck"));
const slashPattern = new RegExp(/\/+$/g);
exports.trailingSlash = {
    name: "trailing-slash",
    version: "0.1.0",
    register(server) {
        server.ext("onPreResponse", async (request, h) => {
            const statusCode = request.response.output
                ? request.response.output.statusCode
                : request.response.statusCode;
            if (statusCode !== 404 || request.path === "/") {
                return h.continue;
            }
            const { pathname, origin, search } = request.url;
            if (!slashPattern.test(pathname)) {
                return h.continue;
            }
            try {
                const path = pathname.replace(slashPattern, "");
                const { statusCode } = await wreck_1.default.request("head", path, { baseUrl: origin });
                if (statusCode < 400) {
                    return h.redirect(`${origin}${search ? path + search : path}`).permanent();
                }
            }
            catch (_a) {
                //
            }
            return h.continue;
        });
    },
};
//# sourceMappingURL=trailing-slash.js.map