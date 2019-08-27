import { Providers } from "@arkecosystem/core-kernel";
import raygun from "raygun";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app
            .bind("errorTracker")
            .toConstantValue(new raygun.Client().init((this.config().all() as unknown) as raygun.raygun.RaygunOptions));
    }
}
