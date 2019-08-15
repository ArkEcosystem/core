import { Contracts } from "@arkecosystem/core-kernel";
import history from "connect-history-api-fallback";
import express, { Handler } from "express";
import { existsSync } from "fs";
import { defaults } from "./defaults";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "explorer",
    async register(container: Contracts.Kernel.IContainer, options) {
        const distPath: string = options.path as string;

        if (!existsSync(distPath)) {
            container
                .resolve<Contracts.Kernel.ILogger>("logger")
                .error(`The ${distPath} directory does not exist. Please build the explorer before using this plugin.`);

            return undefined;
        }

        const staticFileMiddleware: Handler = express.static(distPath);

        const app: express.Application = express();
        app.use(staticFileMiddleware);
        app.use(history());
        app.use(staticFileMiddleware);
        app.get("/", (req, res) => res.render(`${distPath}/index.html`));

        // @ts-ignore
        const server = app.listen(options.server.port, options.server.host, () => {
            container
                .resolve<Contracts.Kernel.ILogger>("logger")
                // @ts-ignore
                .info(`Explorer is listening on http://${server.address().address}:${server.address().port}.`);
        });

        return server;
    },
    async deregister(container: Contracts.Kernel.IContainer, options) {
        try {
            container.resolve<Contracts.Kernel.ILogger>("logger").info("Stopping Explorer");

            await container.resolve("explorer").close();
        } catch (error) {
            // do nothing...
        }
    },
};
