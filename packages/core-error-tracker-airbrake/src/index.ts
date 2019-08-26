import { Providers } from "@arkecosystem/core-kernel";
import AirBrake from "airbrake-js";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("errorTracker").toConstantValue(new AirBrake(this.config().all()));
    }
}
