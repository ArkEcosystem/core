import { Contracts, Support } from "@arkecosystem/core-kernel";
import history from "connect-history-api-fallback";
import express, { Handler } from "express";
import { existsSync } from "fs";
import { defaults } from "./defaults";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        const distPath: string = this.opts.path as string;

        if (!existsSync(distPath)) {
            this.app
                .resolve<Contracts.Kernel.ILogger>("logger")
                .error(`The ${distPath} directory does not exist. Please build the explorer before using this plugin.`);
            return;
        }

        const staticFileMiddleware: Handler = express.static(distPath);

        const app: express.Application = express();
        app.use(staticFileMiddleware);
        app.use(history());
        app.use(staticFileMiddleware);
        app.get("/", (req, res) => res.render(`${distPath}/index.html`));

        // @ts-ignore
        const server = app.listen(this.opts.server.port, this.opts.server.host, () => {
            this.app
                .resolve<Contracts.Kernel.ILogger>("logger")
                // @ts-ignore
                .info(`Explorer is listening on http://${server.address().address}:${server.address().port}.`);
        });

        this.app.bind("explorer", server);
    }

    public async dispose(): Promise<void> {
        try {
            this.app.resolve<Contracts.Kernel.ILogger>("logger").info("Stopping Explorer");

            await this.app.resolve("explorer").close();
        } catch (error) {
            // do nothing...
        }
    }

    public getDefaults(): Record<string, any> {
        return defaults;
    }

    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
