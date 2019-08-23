import { Support } from "@arkecosystem/core-kernel";
import raygun from "raygun";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(
            "errorTracker",
            new raygun.Client().init((this.config().all() as unknown) as raygun.raygun.RaygunOptions),
        );
    }

    public provides(): string[] {
        return ["errorTracker"];
    }
}
