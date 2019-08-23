import { Contracts, Support } from "@arkecosystem/core-kernel";
import history from "connect-history-api-fallback";
import express, { Handler } from "express";
import { existsSync } from "fs";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        const distPath: string = this.config().get("path");

        if (!existsSync(distPath)) {
            this.app
                .resolve<Contracts.Kernel.ILogger>("log")
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
        const server = app.listen(this.config().get("server.port"), this.config().get("server.host"), () => {
            this.app
                .resolve<Contracts.Kernel.ILogger>("log")
                // @ts-ignore
                .info(`Explorer is listening on http://${server.address().address}:${server.address().port}.`);
        });

        this.app.bind("explorer", server);
    }

    public async dispose(): Promise<void> {
        try {
            this.app.resolve<Contracts.Kernel.ILogger>("log").info("Stopping Explorer");

            await this.app.resolve("explorer").close();
        } catch (error) {
            // do nothing...
        }
    }

    public provides(): string[] {
        return ["explorer"];
    }
}
