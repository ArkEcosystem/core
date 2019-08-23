import { Support } from "@arkecosystem/core-kernel";
import { startServer } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("vote-report", startServer(this.config().all()));
        this.app.bind("vote-report.options", this.config().all());
    }

    public async dispose(): Promise<void> {
        await this.app.resolve("vote-report").stop();
    }

    public provides(): string[] {
        return ["vote-report"];
    }
}
