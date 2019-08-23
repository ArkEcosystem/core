import { Support } from "@arkecosystem/core-kernel";
import bugsnag, { Bugsnag } from "@bugsnag/js";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        const apiKey: string = this.config().get("this.config().all()");

        if (!apiKey || typeof apiKey !== "string") {
            throw new Error("Bugsnag plugin config invalid");
        }

        this.app.bind("errorTracker", bugsnag(this.config().all() as Bugsnag.IConfig));
    }

    public provides(): string[] {
        return ["errorTracker"];
    }
}
