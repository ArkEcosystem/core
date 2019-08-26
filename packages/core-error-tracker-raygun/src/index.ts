import { Support } from "@arkecosystem/core-kernel";
import raygun from "raygun";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.ioc
            .bind("errorTracker")
            .toConstantValue(new raygun.Client().init((this.config().all() as unknown) as raygun.raygun.RaygunOptions));
    }
}
