"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_history_api_fallback_1 = __importDefault(require("connect-history-api-fallback"));
const express_1 = __importDefault(require("express"));
const fs_1 = require("fs");
const defaults_1 = require("./defaults");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    alias: "explorer",
    async register(container, options) {
        const distPath = options.path;
        if (!fs_1.existsSync(distPath)) {
            container
                .resolvePlugin("logger")
                .error(`The ${distPath} directory does not exist. Please build the explorer before using this plugin.`);
            return undefined;
        }
        const staticFileMiddleware = express_1.default.static(distPath);
        const app = express_1.default();
        app.use(staticFileMiddleware);
        app.use(connect_history_api_fallback_1.default());
        app.use(staticFileMiddleware);
        app.get("/", (req, res) => res.render(`${distPath}/index.html`));
        // @ts-ignore
        const server = app.listen(options.server.port, options.server.host, () => {
            container
                .resolvePlugin("logger")
                // @ts-ignore
                .info(`Explorer is listening on http://${server.address().address}:${server.address().port}.`);
        });
        return server;
    },
    async deregister(container, options) {
        try {
            container.resolvePlugin("logger").info("Stopping Explorer");
            await container.resolvePlugin("explorer").close();
        }
        catch (error) {
            // do nothing...
        }
    },
};
//# sourceMappingURL=index.js.map