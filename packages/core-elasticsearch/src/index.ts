import { Support } from "@arkecosystem/core-kernel";
import { client } from "./client";
import { watchIndices } from "./indices";
import { startServer } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (
            typeof this.config().get("client") !== "object" ||
            Array.isArray(this.config().get("client")) ||
            typeof this.config().get("chunkSize") !== "number"
        ) {
            throw new Error("Elasticsearch plugin config invalid");
        }

        await client.setUp(this.config().get("client"));

        await watchIndices(this.config().get("chunkSize"));

        this.app.bind("elasticsearch", await startServer(this.config().get("server")));
    }

    public async dispose(): Promise<void> {
        await this.app.resolve("elasticsearch").stop();
    }

    public provides(): string[] {
        return ["elasticsearch"];
    }
}
