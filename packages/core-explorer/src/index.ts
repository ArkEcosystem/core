import { Providers } from "@arkecosystem/core-kernel";
import history from "connect-history-api-fallback";
import express, { Handler } from "express";
import { existsSync } from "fs";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        const distPath: string = this.config().get("path");

        if (!existsSync(distPath)) {
            this.app.log.error(
                `The ${distPath} directory does not exist. Please build the explorer before using this plugin.`,
            );
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
            this.app.log
                // @ts-ignore
                .info(`Explorer is listening on http://${server.address().address}:${server.address().port}.`);
        });

        this.app.bind("explorer").toConstantValue(server);
    }

    public async dispose(): Promise<void> {
        try {
            this.app.log.info("Stopping Explorer");

            await this.app.get<any>("explorer").close();
        } catch (error) {
            // do nothing...
        }
    }
}
