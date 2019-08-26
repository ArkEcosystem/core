import { Providers } from "@arkecosystem/core-kernel";
import { client } from "./client";
import { watchIndices } from "./indices";
import { startServer } from "./server";

export class ServiceProvider extends Providers.AbstractServiceProvider {
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

        this.ioc.bind("elasticsearch").toConstantValue(await startServer(this.config().get("server")));
    }

    public async dispose(): Promise<void> {
        await this.ioc.get<any>("elasticsearch").stop();
    }
}
